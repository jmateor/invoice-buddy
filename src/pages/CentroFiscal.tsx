import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Download, FileText, CheckCircle2, AlertTriangle, Receipt, Calendar, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import GuiaUso from "@/components/GuiaUso";

const fmt = (n: number) => `RD$ ${Number(n || 0).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

type Tipo = "606" | "607" | "608";

interface ResumenTipo {
  cantidad: number;
  total_monto: number;
  total_itbis: number;
  errores: { fila: number; campo: string; mensaje: string }[];
  filename?: string;
  txt?: string;
  archivo_path?: string | null;
}

interface PeriodoRow {
  id: string;
  periodo: string;
  tipo: string;
  estado: string;
  cantidad_registros: number;
  total_monto: number;
  archivo_txt_path: string | null;
  fecha_generacion: string | null;
  fecha_remision: string | null;
}

const periodoActual = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function CentroFiscal() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState(periodoActual());
  const [loading, setLoading] = useState<Tipo | null>(null);
  const [resumen, setResumen] = useState<Record<Tipo, ResumenTipo | null>>({
    "606": null, "607": null, "608": null,
  });
  const [historial, setHistorial] = useState<PeriodoRow[]>([]);

  const diaLimite = useMemo(() => {
    const hoy = new Date();
    const limite = new Date(hoy.getFullYear(), hoy.getMonth(), 15);
    if (hoy > limite) limite.setMonth(limite.getMonth() + 1);
    const dias = Math.ceil((limite.getTime() - hoy.getTime()) / 86400000);
    return { fecha: limite, dias };
  }, []);

  const loadHistorial = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("dgii_periodos_remitidos")
      .select("*")
      .order("periodo", { ascending: false })
      .limit(30);
    setHistorial((data as any) || []);
  };

  useEffect(() => { loadHistorial(); }, [user]);

  const generar = async (tipo: Tipo, persistir: boolean) => {
    if (!/^\d{6}$/.test(periodo)) {
      toast.error("Período inválido. Formato AAAAMM (ej: 202610)");
      return;
    }
    setLoading(tipo);
    try {
      const { data, error } = await supabase.functions.invoke("dgii-generar-reporte", {
        body: { tipo, periodo, persistir },
      });
      if (error) throw error;
      setResumen((prev) => ({
        ...prev,
        [tipo]: {
          cantidad: data.cantidad,
          total_monto: data.total_monto,
          total_itbis: data.total_itbis,
          errores: data.errores || [],
          filename: data.filename,
          txt: data.txt,
          archivo_path: data.archivo_path,
        },
      }));
      if (persistir) {
        toast.success(`Archivo ${tipo} generado y guardado`);
        loadHistorial();
      } else {
        toast.success(`Validación ${tipo}: ${data.cantidad} registros · ${data.errores.length} alertas`);
      }
    } catch (e: any) {
      toast.error(e?.message || "Error al generar reporte");
    } finally {
      setLoading(null);
    }
  };

  const descargar = (r: ResumenTipo) => {
    if (!r?.txt || !r.filename) return;
    const blob = new Blob([r.txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = r.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const descargarDesdeStorage = async (path: string) => {
    const { data, error } = await supabase.storage.from("reportes-fiscales").download(path);
    if (error) { toast.error(error.message); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = path.split("/").pop() || "reporte.TXT";
    a.click();
    URL.revokeObjectURL(url);
  };

  const marcarRemitido = async (tipo: Tipo) => {
    const r = resumen[tipo];
    if (!r?.archivo_path) {
      toast.error("Primero genera y guarda el archivo");
      return;
    }
    const { error } = await supabase
      .from("dgii_periodos_remitidos")
      .update({ estado: "enviado", fecha_remision: new Date().toISOString() })
      .eq("user_id", user!.id)
      .eq("periodo", periodo)
      .eq("tipo", tipo);
    if (error) { toast.error(error.message); return; }
    toast.success(`Período ${periodo} ${tipo} marcado como remitido a la DGII`);
    loadHistorial();
  };

  const tarjeta = (tipo: Tipo, label: string) => {
    const r = resumen[tipo];
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>{label}</span>
            <Badge variant={tipo === "608" ? "destructive" : "secondary"}>{tipo}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {r ? (
            <>
              <div className="text-2xl font-bold">{r.cantidad}</div>
              <div className="text-xs text-muted-foreground">registros</div>
              {tipo !== "608" && (
                <div className="text-sm">{fmt(r.total_monto)} <span className="text-muted-foreground text-xs">total</span></div>
              )}
              {r.errores.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3" /> {r.errores.length} alertas
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => descargar(r)} disabled={!r.txt}>
                  <Download className="h-3 w-3 mr-1" /> TXT
                </Button>
                <Button size="sm" onClick={() => generar(tipo, true)} disabled={loading === tipo}>
                  {loading === tipo ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileText className="h-3 w-3 mr-1" />}
                  Guardar
                </Button>
                {r.archivo_path && (
                  <Button size="sm" variant="secondary" onClick={() => marcarRemitido(tipo)}>
                    <Send className="h-3 w-3 mr-1" /> Remitido
                  </Button>
                )}
              </div>
            </>
          ) : (
            <Button size="sm" className="w-full" onClick={() => generar(tipo, false)} disabled={loading === tipo}>
              {loading === tipo ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : null}
              Validar y previsualizar
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" /> Centro Fiscal DGII
          </h1>
          <p className="text-muted-foreground">Cierre mensual de los formatos 606, 607 y 608</p>
        </div>
        <div className="flex items-center gap-3 text-sm bg-muted/50 px-4 py-2 rounded-lg">
          <Calendar className="h-4 w-4 text-primary" />
          <span>
            Próxima fecha límite DGII: <strong>{diaLimite.fecha.toLocaleDateString("es-DO")}</strong>
            <span className="text-muted-foreground ml-2">({diaLimite.dias} días)</span>
          </span>
        </div>
      </div>

      <GuiaUso
        storageKey="centro-fiscal"
        titulo="Cómo cerrar el mes fiscal en 5 minutos"
        pasos={[
          { titulo: "1. Selecciona el período", descripcion: "Formato AAAAMM (ej: 202610 = octubre 2026)." },
          { titulo: "2. Valida 606, 607 y 608", descripcion: "Pulsa 'Validar' para ver totales y posibles alertas." },
          { titulo: "3. Genera y guarda los TXT", descripcion: "El archivo queda guardado en tu nube y listo para descargar." },
          { titulo: "4. Sube los TXT a la Oficina Virtual DGII", descripcion: "Marca cada reporte como 'Remitido' al confirmar el envío." },
          { titulo: "5. Bloqueo automático", descripcion: "Después de remitir, el sistema impide modificar facturas/compras de ese período." },
        ]}
        tip="La fecha límite oficial es el día 15 del mes siguiente."
      />

      <Tabs defaultValue="cierre" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cierre">Cierre del período</TabsTrigger>
          <TabsTrigger value="historial">Historial de remisiones</TabsTrigger>
        </TabsList>

        <TabsContent value="cierre" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Período (AAAAMM)</Label>
                  <Input
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="202610"
                    className="w-32 font-mono"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setResumen({ "606": null, "607": null, "608": null });
                    (["606","607","608"] as Tipo[]).forEach((t) => generar(t, false));
                  }}
                  disabled={!!loading}
                >
                  Validar todo
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {tarjeta("606", "Compras (606)")}
            {tarjeta("607", "Ventas (607)")}
            {tarjeta("608", "Anulados (608)")}
          </div>

          {(["606","607","608"] as Tipo[]).map((t) => {
            const r = resumen[t];
            if (!r || r.errores.length === 0) return null;
            return (
              <Card key={t} className="border-destructive/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Alertas en {t}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs space-y-1">
                    {r.errores.slice(0, 20).map((e, i) => (
                      <li key={i}>· Fila {e.fila} — {e.campo}: {e.mensaje}</li>
                    ))}
                    {r.errores.length > 20 && <li className="text-muted-foreground">… {r.errores.length - 20} más</li>}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Períodos generados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Registros</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Generado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aún no hay remisiones</TableCell></TableRow>
                  ) : historial.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">{p.periodo}</TableCell>
                      <TableCell><Badge variant="secondary">{p.tipo}</Badge></TableCell>
                      <TableCell className="text-right">{p.cantidad_registros}</TableCell>
                      <TableCell className="text-right">{fmt(Number(p.total_monto))}</TableCell>
                      <TableCell>
                        <Badge variant={
                          p.estado === "enviado" || p.estado === "aceptado" ? "default" :
                          p.estado === "rechazado" ? "destructive" : "outline"
                        }>
                          {p.estado === "enviado" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {p.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {p.fecha_generacion ? new Date(p.fecha_generacion).toLocaleDateString("es-DO") : "—"}
                      </TableCell>
                      <TableCell>
                        {p.archivo_txt_path && (
                          <Button size="sm" variant="ghost" onClick={() => descargarDesdeStorage(p.archivo_txt_path!)}>
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}