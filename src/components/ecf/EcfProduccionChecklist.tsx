import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Rocket, RefreshCw } from "lucide-react";

interface Props {
  userId?: string;
  refreshKey?: number;
}

type Estado = "ok" | "warn" | "fail" | "loading";

interface Check {
  id: string;
  titulo: string;
  estado: Estado;
  detalle: string;
  accion?: string;
  bloqueante: boolean;
}

const ICON: Record<Estado, JSX.Element> = {
  ok: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  warn: <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
  fail: <XCircle className="h-4 w-4 text-destructive" />,
  loading: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
};

export default function EcfProduccionChecklist({ userId, refreshKey }: Props) {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      const results: Check[] = [];

      const [negocioRes, ecfRes, ecfSeqRes, ncfSeqRes, ultTestRes] = await Promise.all([
        supabase.from("configuracion_negocio").select("*").limit(1).maybeSingle(),
        supabase.from("ecf_configuracion").select("*").limit(1).maybeSingle(),
        supabase.from("ecf_secuencias").select("*"),
        supabase.from("ncf_secuencias").select("*"),
        supabase
          .from("ecf_pruebas_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const negocio: any = negocioRes.data;
      const ecf: any = ecfRes.data;
      const ecfSeqs: any[] = (ecfSeqRes.data as any) || [];
      const ncfSeqs: any[] = (ncfSeqRes.data as any) || [];
      const ultTest: any = ultTestRes.data;

      // 1. Datos del negocio
      const negOk = !!(negocio?.rnc && negocio?.razon_social && negocio?.direccion && negocio?.telefono);
      results.push({
        id: "negocio",
        titulo: "Datos del negocio completos",
        bloqueante: true,
        estado: negOk ? "ok" : "fail",
        detalle: negOk
          ? `RNC ${negocio.rnc} · ${negocio.razon_social}`
          : "Faltan RNC, razón social, dirección o teléfono en Configuraciones → Negocio.",
        accion: negOk ? undefined : "Completa la pestaña Negocio.",
      });

      // 2. Certificado cargado + vigente
      const cert = ecf?.certificado_path;
      const vence = ecf?.certificado_vigencia_hasta ? new Date(ecf.certificado_vigencia_hasta) : null;
      const hoy = new Date();
      let certEstado: Estado = "fail";
      let certDetalle = "No hay certificado .pfx cargado.";
      if (cert && vence) {
        const dias = Math.floor((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        if (dias < 0) {
          certEstado = "fail";
          certDetalle = `Certificado VENCIDO el ${vence.toLocaleDateString("es-DO")}.`;
        } else if (dias <= 30) {
          certEstado = "warn";
          certDetalle = `Certificado vence en ${dias} días (${vence.toLocaleDateString("es-DO")}).`;
        } else {
          certEstado = "ok";
          certDetalle = `Vigente hasta ${vence.toLocaleDateString("es-DO")} (${dias} días).`;
        }
      } else if (cert) {
        certEstado = "warn";
        certDetalle = "Certificado cargado pero sin fecha de vigencia registrada.";
      }
      results.push({
        id: "certificado",
        titulo: "Certificado digital .pfx vigente",
        bloqueante: true,
        estado: certEstado,
        detalle: certDetalle,
        accion: certEstado === "ok" ? undefined : "Sube o renueva el .pfx en Configurar e-CF.",
      });

      // 3. Ambiente = Producción
      const amb = (ecf?.ambiente ?? "").toString();
      const esProd = /prod/i.test(amb);
      results.push({
        id: "ambiente",
        titulo: "Ambiente configurado en Producción",
        bloqueante: true,
        estado: esProd ? "ok" : "warn",
        detalle: amb ? `Ambiente actual: ${amb}` : "Ambiente no configurado.",
        accion: esProd
          ? undefined
          : "Cambia el ambiente a 'Producción' solo tras la aprobación formal de DGII.",
      });

      // 4. URLs de Producción
      const urls = [
        ecf?.url_autenticacion,
        ecf?.url_recepcion,
        ecf?.url_consulta,
        ecf?.url_anulacion,
        ecf?.url_aprobacion_comercial,
      ].filter(Boolean) as string[];
      const urlsProd = urls.length > 0 && urls.every((u) => /\/ecf\//i.test(u) && !/testecf|certecf/i.test(u));
      results.push({
        id: "urls",
        titulo: "URLs DGII apuntan a Producción",
        bloqueante: true,
        estado: urlsProd ? "ok" : urls.length === 5 ? "warn" : "fail",
        detalle:
          urls.length === 0
            ? "No hay URLs DGII configuradas."
            : urlsProd
            ? "Las 5 URLs apuntan al ambiente productivo (/ecf/)."
            : `${urls.length}/5 URLs configuradas — aún apuntan a TesteCF/CerteCF.`,
        accion: urlsProd ? undefined : "Usa el asistente Configurar e-CF y elige ambiente Producción.",
      });

      // 5. Secuencias e-CF autorizadas
      const seqActivas = ecfSeqs.filter((s: any) => s.activo);
      const seqVigentes = seqActivas.filter(
        (s: any) => !s.fecha_vencimiento || new Date(s.fecha_vencimiento) > hoy,
      );
      const tiposMin = ["31", "32", "34", "43", "44", "45"];
      const tiposPresentes = new Set(seqVigentes.map((s: any) => s.tipo_ecf));
      const faltantes = tiposMin.filter((t) => !tiposPresentes.has(t));
      results.push({
        id: "secuencias-ecf",
        titulo: "Secuencias e-CF autorizadas (E31–E45)",
        bloqueante: true,
        estado: faltantes.length === 0 ? "ok" : seqVigentes.length > 0 ? "warn" : "fail",
        detalle:
          seqActivas.length === 0
            ? "No hay secuencias e-CF activas."
            : faltantes.length === 0
            ? `${seqVigentes.length} secuencias activas y vigentes.`
            : `Faltan tipos: E${faltantes.join(", E")}.`,
        accion: faltantes.length === 0 ? undefined : "Solicita los rangos faltantes en la Oficina Virtual DGII.",
      });

      // 6. Última prueba de firma OK y reciente
      let testEstado: Estado = "fail";
      let testDetalle = "Nunca se ha ejecutado 'Probar firma + autenticación'.";
      if (ultTest) {
        const cuando = new Date(ultTest.created_at);
        const horas = Math.floor((hoy.getTime() - cuando.getTime()) / (1000 * 60 * 60));
        if (ultTest.success) {
          testEstado = horas <= 72 ? "ok" : "warn";
          testDetalle = `Última prueba OK hace ${horas}h (${cuando.toLocaleString("es-DO")}).`;
        } else {
          testEstado = "fail";
          testDetalle = `Última prueba FALLÓ (${ultTest.codigo ?? "sin código"}) hace ${horas}h.`;
        }
      }
      results.push({
        id: "prueba-firma",
        titulo: "Prueba de firma y autenticación DGII exitosa",
        bloqueante: true,
        estado: testEstado,
        detalle: testDetalle,
        accion: testEstado === "ok" ? undefined : "Ejecuta 'Probar firma + autenticación' desde esta misma pestaña.",
      });

      // 7. Secuencias NCF (fallback impreso) al menos B01 y B02 activas
      const ncfActivas = ncfSeqs.filter((s: any) => s.activo);
      const ncfOk = ncfActivas.some((s: any) => s.tipo_comprobante === "B01") &&
        ncfActivas.some((s: any) => s.tipo_comprobante === "B02");
      results.push({
        id: "ncf-fallback",
        titulo: "Numeración NCF impresa de respaldo (B01/B02)",
        bloqueante: false,
        estado: ncfOk ? "ok" : "warn",
        detalle: ncfOk
          ? "B01 y B02 activas como contingencia."
          : "Sin NCF de contingencia — si DGII cae no podrás facturar.",
        accion: ncfOk ? undefined : "Configura al menos B01 y B02 en la tabla Numeración fiscal.",
      });

      if (!cancel) {
        setChecks(results);
        setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [userId, refreshKey, tick]);

  const { total, listos, bloqueantesPendientes, pct } = useMemo(() => {
    const total = checks.length;
    const listos = checks.filter((c) => c.estado === "ok").length;
    const bloqueantesPendientes = checks.filter((c) => c.bloqueante && c.estado !== "ok").length;
    const pct = total ? Math.round((listos / total) * 100) : 0;
    return { total, listos, bloqueantesPendientes, pct };
  }, [checks]);

  const listoParaProd = bloqueantesPendientes === 0 && total > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            Checklist de Producción
          </CardTitle>
          <CardDescription>
            Verifica automáticamente qué puntos técnicos están listos para emitir e-CF fiscales reales en DGII.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setTick((t) => t + 1)} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">Reverificar</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {listos} de {total} puntos listos
            </span>
            <Badge
              variant={listoParaProd ? "default" : bloqueantesPendientes > 0 ? "destructive" : "secondary"}
            >
              {listoParaProd
                ? "✅ Listo para Producción"
                : `${bloqueantesPendientes} bloqueante${bloqueantesPendientes === 1 ? "" : "s"}`}
            </Badge>
          </div>
          <Progress value={pct} />
          <p className="text-xs text-muted-foreground">
            {pct}% completado · los puntos marcados como bloqueantes deben estar en verde antes del paso a Producción.
          </p>
        </div>

        <ul className="space-y-2">
          {checks.map((c) => (
            <li
              key={c.id}
              className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                c.estado === "ok"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : c.estado === "warn"
                  ? "border-amber-500/30 bg-amber-500/5"
                  : c.estado === "fail"
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border"
              }`}
            >
              <div className="mt-0.5">{ICON[c.estado]}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{c.titulo}</span>
                  {c.bloqueante && (
                    <Badge variant="outline" className="text-[10px]">
                      bloqueante
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{c.detalle}</p>
                {c.accion && c.estado !== "ok" && (
                  <p className="text-xs mt-1">
                    <strong>Acción:</strong> {c.accion}
                  </p>
                )}
              </div>
            </li>
          ))}
          {!loading && checks.length === 0 && (
            <li className="text-xs text-muted-foreground text-center py-4">
              Sin datos aún.
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}