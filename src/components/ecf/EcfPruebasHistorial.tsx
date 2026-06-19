import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, XCircle, RefreshCw, History, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { diagnosticarCodigoDgii } from "@/lib/dgiiCodeDiagnostics";

interface PruebaLog {
  id: string;
  created_at: string;
  success: boolean;
  codigo: string | null;
  ambiente: string | null;
  mensaje: string | null;
  error: string | null;
  duracion_ms: number | null;
  certificado_vencido: boolean | null;
  certificado_vigencia_hasta: string | null;
  url_autenticacion: string | null;
  token_preview: string | null;
}

interface Props {
  refreshKey?: number;
}

export default function EcfPruebasHistorial({ refreshKey = 0 }: Props) {
  const [logs, setLogs] = useState<PruebaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ecf_pruebas_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      toast.error("No se pudo cargar el historial: " + error.message);
    } else {
      setLogs((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const handleClear = async () => {
    if (!confirm("¿Borrar todo el historial de pruebas DGII?")) return;
    setClearing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setClearing(false);
      return;
    }
    const { error } = await supabase
      .from("ecf_pruebas_log")
      .delete()
      .eq("user_id", user.id);
    setClearing(false);
    if (error) {
      toast.error("Error al borrar: " + error.message);
    } else {
      toast.success("Historial borrado");
      setLogs([]);
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("es-DO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Historial de pruebas (Troubleshooting DGII)
          </CardTitle>
          <CardDescription>
            Últimos 50 intentos de "Probar firma + autenticación" con código DGII, duración y pasos sugeridos para corregir cada error.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={clearing || logs.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando historial...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">
            Aún no hay intentos registrados. Ejecuta "Probar firma + autenticación" para generar el primero.
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {logs.map((log) => {
              const diag = !log.success ? diagnosticarCodigoDgii(log.codigo || undefined) : null;
              return (
                <AccordionItem key={log.id} value={log.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      {log.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {log.success ? (log.mensaje || "OK") : (log.error || "Error")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {fmt(log.created_at)}
                          {log.duracion_ms != null && ` · ${log.duracion_ms} ms`}
                          {log.ambiente && ` · ${log.ambiente}`}
                        </div>
                      </div>
                      {log.codigo && (
                        <Badge variant={log.success ? "secondary" : "destructive"} className="shrink-0">
                          {log.codigo}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-7 text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><strong>Fecha:</strong> {fmt(log.created_at)}</div>
                        {log.codigo && <div><strong>Código DGII:</strong> {log.codigo}</div>}
                        {log.ambiente && <div><strong>Ambiente:</strong> {log.ambiente}</div>}
                        {log.duracion_ms != null && <div><strong>Duración:</strong> {log.duracion_ms} ms</div>}
                        {log.certificado_vigencia_hasta && (
                          <div>
                            <strong>Cert. vence:</strong>{" "}
                            {new Date(log.certificado_vigencia_hasta).toLocaleDateString("es-DO")}
                            {log.certificado_vencido && " ⚠️"}
                          </div>
                        )}
                        {log.url_autenticacion && (
                          <div className="sm:col-span-2 truncate">
                            <strong>URL:</strong> {log.url_autenticacion}
                          </div>
                        )}
                        {log.token_preview && (
                          <div className="sm:col-span-2 truncate">
                            <strong>Token:</strong> <code>{log.token_preview}</code>
                          </div>
                        )}
                      </div>

                      {diag && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                          <div className="font-medium text-destructive">{diag.titulo}</div>
                          <p className="text-xs text-muted-foreground">{diag.causa}</p>
                          <div>
                            <div className="text-xs font-semibold mb-1">Pasos sugeridos:</div>
                            <ol className="list-decimal list-inside text-xs space-y-1">
                              {diag.acciones.map((a, i) => (
                                <li key={i}>{a}</li>
                              ))}
                            </ol>
                          </div>
                          {diag.ejemplo && (
                            <p className="text-xs italic text-muted-foreground border-l-2 border-muted pl-2">
                              {diag.ejemplo}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}