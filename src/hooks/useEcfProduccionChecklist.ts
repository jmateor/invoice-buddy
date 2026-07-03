import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Estado = "ok" | "warn" | "fail" | "loading";

export interface Check {
  id: string;
  titulo: string;
  estado: Estado;
  detalle: string;
  accion?: string;
  bloqueante: boolean;
}

export interface ProduccionChecklistResult {
  checks: Check[];
  loading: boolean;
  total: number;
  listos: number;
  bloqueantesPendientes: number;
  pct: number;
  listoParaProd: boolean;
}

export function useEcfProduccionChecklist(
  userId?: string,
  refreshKey?: number
): ProduccionChecklistResult {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const forceRefresh = () => setTick((t) => t + 1);

  useEffect(() => {
    if (refreshKey !== undefined) {
      forceRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

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
  }, [userId, tick]);

  const { total, listos, bloqueantesPendientes, pct } = useMemo(() => {
    const total = checks.length;
    const listos = checks.filter((c) => c.estado === "ok").length;
    const bloqueantesPendientes = checks.filter((c) => c.bloqueante && c.estado !== "ok").length;
    const pct = total ? Math.round((listos / total) * 100) : 0;
    return { total, listos, bloqueantesPendientes, pct };
  }, [checks]);

  const listoParaProd = bloqueantesPendientes === 0 && total > 0;

  return {
    checks,
    loading,
    total,
    listos,
    bloqueantesPendientes,
    pct,
    listoParaProd,
  };
}
