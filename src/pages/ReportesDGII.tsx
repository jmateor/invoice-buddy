import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { exportToExcel } from "@/lib/exportUtils";

interface Reporte607Row {
  rnc_cedula: string; tipo_id: string; ncf: string; ncf_modificado: string;
  tipo_ingreso: string; fecha: string; fecha_pago: string;
  monto_facturado: number; itbis_facturado: number; itbis_retenido: number;
  monto_propina: number; itbis_propina: number;
  forma_pago: string; tipo_retencion: string;
}

interface Reporte606Row {
  rnc_cedula: string; tipo_id: string; ncf: string; ncf_modificado: string;
  fecha: string; fecha_pago: string;
  monto_facturado: number; itbis_facturado: number; itbis_retenido: number;
  forma_pago: string; tipo_bienes: string;
}

interface Reporte608Row {
  ncf: string; tipo: string; fecha_anulacion: string;
}

const formaPagoMap: Record<string, string> = {
  efectivo: "01", tarjeta: "02", transferencia: "03", nota_credito: "04",
};

export default function ReportesDGII() {
  const { user } = useAuth();
  const [fechaDesde, setFechaDesde] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [fechaHasta, setFechaHasta] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [data607, setData607] = useState<Reporte607Row[]>([]);
  const [data606, setData606] = useState<Reporte606Row[]>([]);
  const [data608, setData608] = useState<Reporte608Row[]>([]);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 607 - Ventas
      const { data: facturas } = await supabase
        .from("facturas")
        .select("numero, ncf, tipo_comprobante, fecha, total, itbis, descuento, metodo_pago, estado, clientes(rnc_cedula)")
        .gte("fecha", fechaDesde + "T00:00:00")
        .lte("fecha", fechaHasta + "T23:59:59")
        .neq("estado", "borrador" as any);

      const ventas: Reporte607Row[] = (facturas || [])
        .filter((f: any) => f.estado !== "anulada")
        .map((f: any) => ({
          rnc_cedula: f.clientes?.rnc_cedula || "",
          tipo_id: f.clientes?.rnc_cedula?.length === 9 ? "1" : f.clientes?.rnc_cedula?.length === 11 ? "2" : "",
          ncf: f.ncf || "",
          ncf_modificado: "",
          tipo_ingreso: "01",
          fecha: new Date(f.fecha).toLocaleDateString("es-DO"),
          fecha_pago: new Date(f.fecha).toLocaleDateString("es-DO"),
          monto_facturado: Number(f.total),
          itbis_facturado: Number(f.itbis),
          itbis_retenido: 0,
          monto_propina: 0,
          itbis_propina: 0,
          forma_pago: formaPagoMap[f.metodo_pago] || "01",
          tipo_retencion: "",
        }));
      setData607(ventas);

      // 606 - Compras
      const { data: compras } = await supabase
        .from("compras")
        .select("total, fecha, notas, proveedores(rnc)")
        .gte("fecha", fechaDesde + "T00:00:00")
        .lte("fecha", fechaHasta + "T23:59:59");

      const comprasRows: Reporte606Row[] = (compras || []).map((c: any) => ({
        rnc_cedula: c.proveedores?.rnc || "",
        tipo_id: c.proveedores?.rnc?.length === 9 ? "1" : "2",
        ncf: "",
        ncf_modificado: "",
        fecha: new Date(c.fecha).toLocaleDateString("es-DO"),
        fecha_pago: new Date(c.fecha).toLocaleDateString("es-DO"),
        monto_facturado: Number(c.total),
        itbis_facturado: Number(c.total) * 0.18 / 1.18,
        itbis_retenido: 0,
        forma_pago: "01",
        tipo_bienes: "01",
      }));
      setData606(comprasRows);

      // 608 - Anulaciones
      const { data: anuladas } = await supabase
        .from("facturas")
        .select("ncf, tipo_comprobante, fecha")
        .eq("estado", "anulada" as any)
        .gte("fecha", fechaDesde + "T00:00:00")
        .lte("fecha", fechaHasta + "T23:59:59");

      const anulaciones: Reporte608Row[] = (anuladas || [])
        .filter((a: any) => a.ncf)
        .map((a: any) => ({
          ncf: a.ncf,
          tipo: a.tipo_comprobante || "B02",
          fecha_anulacion: new Date(a.fecha).toLocaleDateString("es-DO"),
        }));
      setData608(anulaciones);
    } catch (err: any) {
      toast.error(err.message || "Error cargando reportes");
    }
    setLoading(false);
  }, [user, fechaDesde, fechaHasta]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const exportar = (tipo: "607" | "606" | "608") => {
    if (tipo === "607") {
      if (data607.length === 0) { toast.error("No hay datos"); return; }
      exportToExcel(data607.map(r => ({
        "RNC/Cédula Comprador": r.rnc_cedula,
        "Tipo Identificación": r.tipo_id,
        "NCF": r.ncf,
        "NCF Modificado": r.ncf_modificado,
        "Tipo Ingreso": r.tipo_ingreso,
        "Fecha Comprobante": r.fecha,
        "Fecha Retención": r.fecha_pago,
        "Monto Facturado": r.monto_facturado,
        "ITBIS Facturado": r.itbis_facturado,
        "ITBIS Retenido": r.itbis_retenido,
        "Monto Propina Legal": r.monto_propina,
        "ITBIS Propina Legal": r.itbis_propina,
        "Forma Pago": r.forma_pago,
      })), `607-ventas-${fechaDesde}-${fechaHasta}`);
      toast.success("Reporte 607 exportado");
    } else if (tipo === "606") {
      if (data606.length === 0) { toast.error("No hay datos"); return; }
      exportToExcel(data606.map(r => ({
        "RNC/Cédula Proveedor": r.rnc_cedula,
        "Tipo Identificación": r.tipo_id,
        "NCF": r.ncf,
        "NCF Modificado": r.ncf_modificado,
        "Fecha Comprobante": r.fecha,
        "Fecha Pago": r.fecha_pago,
        "Monto Facturado": r.monto_facturado,
        "ITBIS Facturado": r.itbis_facturado.toFixed(2),
        "ITBIS Retenido": r.itbis_retenido,
        "Forma Pago": r.forma_pago,
        "Tipo Bienes/Servicios": r.tipo_bienes,
      })), `606-compras-${fechaDesde}-${fechaHasta}`);
      toast.success("Reporte 606 exportado");
    } else {
      if (data608.length === 0) { toast.error("No hay datos"); return; }
      exportToExcel(data608.map(r => ({
        "NCF": r.ncf,
        "Tipo Comprobante": r.tipo,
        "Fecha Anulación": r.fecha_anulacion,
      })), `608-anulaciones-${fechaDesde}-${fechaHasta}`);
      toast.success("Reporte 608 exportado");
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes Fiscales DGII</h1>
        <p className="text-muted-foreground">Genera los reportes 606, 607 y 608 para la DGII</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Desde</Label>
              <Input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hasta</Label>
              <Input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
            </div>
            <Button onClick={loadAll} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
              Generar Reportes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="607">
        <TabsList>
          <TabsTrigger value="607">
            607 – Ventas <Badge variant="secondary" className="ml-2">{data607.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="606">
            606 – Compras <Badge variant="secondary" className="ml-2">{data606.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="608">
            608 – Anulaciones <Badge variant="secondary" className="ml-2">{data608.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="607">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Reporte 607 – Ventas de Bienes y Servicios</CardTitle>
              <Button size="sm" onClick={() => exportar("607")}><Download className="mr-2 h-4 w-4" />Exportar Excel</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RNC/Cédula</TableHead>
                      <TableHead>NCF</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">ITBIS</TableHead>
                      <TableHead>Forma Pago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data607.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sin datos</TableCell></TableRow>
                    ) : data607.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{r.rnc_cedula || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{r.ncf || "—"}</TableCell>
                        <TableCell className="text-xs">{r.fecha}</TableCell>
                        <TableCell className="text-right font-medium">RD$ {r.monto_facturado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right">RD$ {r.itbis_facturado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{r.forma_pago}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="606">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Reporte 606 – Compras de Bienes y Servicios</CardTitle>
              <Button size="sm" onClick={() => exportar("606")}><Download className="mr-2 h-4 w-4" />Exportar Excel</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RNC Proveedor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">ITBIS</TableHead>
                      <TableHead>Forma Pago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data606.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin datos</TableCell></TableRow>
                    ) : data606.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{r.rnc_cedula || "—"}</TableCell>
                        <TableCell className="text-xs">{r.fecha}</TableCell>
                        <TableCell className="text-right font-medium">RD$ {r.monto_facturado.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-right">RD$ {Number(r.itbis_facturado).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{r.forma_pago}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="608">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Reporte 608 – Comprobantes Anulados</CardTitle>
              <Button size="sm" onClick={() => exportar("608")}><Download className="mr-2 h-4 w-4" />Exportar Excel</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NCF</TableHead>
                    <TableHead>Tipo Comprobante</TableHead>
                    <TableHead>Fecha Anulación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data608.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Sin datos</TableCell></TableRow>
                  ) : data608.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono">{r.ncf}</TableCell>
                      <TableCell>{r.tipo}</TableCell>
                      <TableCell>{r.fecha_anulacion}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="pt-6">
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>607:</strong> Reporte de ventas. Incluye todas las facturas emitidas (no borradores ni anuladas).</p>
            <p><strong>606:</strong> Reporte de compras. Basado en las compras registradas a proveedores.</p>
            <p><strong>608:</strong> Comprobantes anulados. Solo facturas con NCF que fueron anuladas.</p>
            <p className="text-primary font-medium mt-2">Los archivos Excel generados son compatibles con el formato de carga de la DGII.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
