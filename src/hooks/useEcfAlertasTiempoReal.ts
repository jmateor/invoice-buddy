import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LS_AMBIENTE_KEY = "ecf:lastAmbiente";
const LS_CERT_VENC_KEY = "ecf:lastCertVencAlertado";

export type EcfAlertaTipo =
  | "CERTIFICADO_EXPIRADO"
  | "AMBIENTE_CAMBIADO"
  | "PRODUCCION_AUTH_FALLO";

export interface EcfAlertaPayload {
  codigo: EcfAlertaTipo;
  mensaje: string;
  ambiente?: string | null;
  ambiente_anterior?: string | null;
  certificado_vigencia_hasta?: string | null;
  raw?: any;
}

function isProduccion(ambiente?: string | null): boolean {
  if (!ambiente) return false;
  const a = ambiente.toLowerCase();
  return a.includes("prod") || a === "produccion" || a === "producción";
}

async function persistirAlerta(userId: string, payload: EcfAlertaPayload) {
  try {
    await supabase.from("ecf_pruebas_log").insert({
      user_id: userId,
      success: false,
      codigo: payload.codigo,
      ambiente: payload.ambiente ?? null,
      mensaje: payload.mensaje,
      error: payload.mensaje,
      certificado_vigencia_hasta: payload.certificado_vigencia_hasta ?? null,
      certificado_vencido: payload.codigo === "CERTIFICADO_EXPIRADO" ? true : null,
      raw: {
        tipo_alerta: "tiempo_real",
        ambiente_anterior: payload.ambiente_anterior ?? null,
        ...(payload.raw ?? {}),
      },
    });
  } catch {
    // no bloquear UX
  }
}

interface Options {
  userId: string | undefined;
  onAlerta?: (a: EcfAlertaPayload) => void;
  /**
   * Intervalo (ms) del re-chequeo periódico de vencimiento de certificado.
   * Por defecto 1 hora. Configurable desde Configuraciones → Fiscal.
   */
  intervaloMs?: number;
}

/**
 * Suscripción en tiempo real a ecf_configuracion + chequeo periódico de vencimiento de certificado.
 * - Detecta cambio de ambiente (CerteCF ↔ Producción, etc.)
 * - Detecta certificado expirado o por expirar (< 7 días)
 * - Registra cada evento en ecf_pruebas_log para que aparezca en el historial de troubleshooting.
 */
export function useEcfAlertasTiempoReal({ userId, onAlerta, intervaloMs }: Options) {
  const lastAmbienteRef = useRef<string | null>(null);
  const lastCertAlertadoRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;

    const checkVencimiento = (vigenciaHasta: string | null, ambiente: string | null) => {
      if (!vigenciaHasta) return;
      const venc = new Date(vigenciaHasta);
      if (isNaN(venc.getTime())) return;
      const ahora = new Date();
      const diasRestantes = Math.floor((venc.getTime() - ahora.getTime()) / 86400000);

      if (diasRestantes < 0) {
        const yaAlertado = lastCertAlertadoRef.current === vigenciaHasta;
        if (yaAlertado) return;
        lastCertAlertadoRef.current = vigenciaHasta;
        localStorage.setItem(LS_CERT_VENC_KEY, vigenciaHasta);

        const payload: EcfAlertaPayload = {
          codigo: "CERTIFICADO_EXPIRADO",
          mensaje: `El certificado .pfx expiró el ${venc.toLocaleDateString("es-DO")}. No se podrán emitir e-CF hasta renovarlo.`,
          ambiente,
          certificado_vigencia_hasta: vigenciaHasta,
        };
        toast.error(payload.mensaje, { duration: 12000 });
        onAlerta?.(payload);
        persistirAlerta(userId, payload);
      } else if (diasRestantes <= 7) {
        // aviso suave (no se persiste como error)
        toast.warning(
          `El certificado .pfx vence en ${diasRestantes} día(s) (${venc.toLocaleDateString("es-DO")}). Gestiona la renovación ahora.`,
          { duration: 9000 }
        );
      }
    };

    const checkAmbiente = (nuevo: string | null) => {
      if (!nuevo) return;
      const anterior = lastAmbienteRef.current ?? localStorage.getItem(LS_AMBIENTE_KEY);
      if (anterior && anterior !== nuevo) {
        const payload: EcfAlertaPayload = {
          codigo: "AMBIENTE_CAMBIADO",
          mensaje: `El ambiente DGII cambió de "${anterior}" a "${nuevo}". Verifica las URLs y vuelve a probar firma + autenticación.`,
          ambiente: nuevo,
          ambiente_anterior: anterior,
        };
        if (isProduccion(nuevo)) {
          toast.warning(payload.mensaje, { duration: 14000 });
        } else {
          toast.info(payload.mensaje, { duration: 10000 });
        }
        onAlerta?.(payload);
        persistirAlerta(userId, payload);
      }
      lastAmbienteRef.current = nuevo;
      localStorage.setItem(LS_AMBIENTE_KEY, nuevo);
    };

    // 1) Carga inicial
    (async () => {
      const { data } = await supabase
        .from("ecf_configuracion")
        .select("ambiente, certificado_vigencia_hasta")
        .limit(1)
        .maybeSingle();
      if (!mounted || !data) return;
      // Inicializa ambiente sin lanzar alerta si es la primera vez
      if (!lastAmbienteRef.current && !localStorage.getItem(LS_AMBIENTE_KEY)) {
        lastAmbienteRef.current = (data as any).ambiente ?? null;
        if ((data as any).ambiente) {
          localStorage.setItem(LS_AMBIENTE_KEY, (data as any).ambiente);
        }
      } else {
        checkAmbiente((data as any).ambiente ?? null);
      }
      checkVencimiento(
        (data as any).certificado_vigencia_hasta ?? null,
        (data as any).ambiente ?? null
      );
    })();

    // 2) Realtime subscription
    const channel = supabase
      .channel("ecf-config-alertas")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ecf_configuracion" },
        (payload: any) => {
          const nuevo = payload?.new ?? {};
          checkAmbiente(nuevo.ambiente ?? null);
          checkVencimiento(nuevo.certificado_vigencia_hasta ?? null, nuevo.ambiente ?? null);
        }
      )
      .subscribe();

    // 3) Re-chequeo periódico de vencimiento (configurable, por defecto 1h)
    const ms = Math.max(60_000, intervaloMs ?? 60 * 60 * 1000);
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("ecf_configuracion")
        .select("ambiente, certificado_vigencia_hasta")
        .limit(1)
        .maybeSingle();
      if (!data) return;
      checkVencimiento(
        (data as any).certificado_vigencia_hasta ?? null,
        (data as any).ambiente ?? null
      );
    }, ms);

    return () => {
      mounted = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [userId, onAlerta, intervaloMs]);
}

/**
 * Helper para registrar el caso especial de fallo de autenticación contra Producción
 * desde el flujo "Probar firma + autenticación". Dispara toast destacado y persiste en el historial.
 */
export async function reportarFalloProduccion(opts: {
  userId: string;
  ambiente?: string | null;
  codigoOriginal?: string | null;
  errorOriginal?: string | null;
}) {
  if (!isProduccion(opts.ambiente)) return false;
  const mensaje = `Falló la autenticación contra PRODUCCIÓN DGII${
    opts.codigoOriginal ? ` (${opts.codigoOriginal})` : ""
  }. La emisión de e-CF fiscales está bloqueada hasta resolverlo.`;
  toast.error(mensaje, { duration: 15000 });
  await persistirAlerta(opts.userId, {
    codigo: "PRODUCCION_AUTH_FALLO",
    mensaje,
    ambiente: opts.ambiente ?? null,
    raw: {
      codigo_original: opts.codigoOriginal ?? null,
      error_original: opts.errorOriginal ?? null,
    },
  });
  return true;
}