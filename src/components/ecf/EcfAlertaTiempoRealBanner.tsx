import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EcfAlertaPayload } from "@/hooks/useEcfAlertasTiempoReal";
import { diagnosticarCodigoDgii } from "@/lib/dgiiCodeDiagnostics";

interface Props {
  alerta: EcfAlertaPayload | null;
  onDismiss: () => void;
}

export default function EcfAlertaTiempoRealBanner({ alerta, onDismiss }: Props) {
  if (!alerta) return null;
  const diag = diagnosticarCodigoDgii(alerta.codigo);
  const isError = alerta.codigo !== "AMBIENTE_CAMBIADO";

  return (
    <div
      role="alert"
      className={`rounded-lg border p-4 flex items-start gap-3 animate-fade-in ${
        isError
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      }`}
    >
      <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">
            {diag?.titulo || alerta.codigo}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background/40">
            {alerta.codigo}
          </span>
        </div>
        <p className="text-sm opacity-90">{alerta.mensaje}</p>
        {alerta.ambiente_anterior && alerta.ambiente && (
          <p className="text-xs opacity-80">
            <strong>Anterior:</strong> {alerta.ambiente_anterior} →{" "}
            <strong>Actual:</strong> {alerta.ambiente}
          </p>
        )}
        {diag && diag.acciones.length > 0 && (
          <ol className="text-xs list-decimal list-inside mt-1 space-y-0.5 opacity-90">
            {diag.acciones.slice(0, 3).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ol>
        )}
        <p className="text-[11px] opacity-70 mt-1">
          📝 Este evento quedó registrado en el historial de troubleshooting.
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 shrink-0"
        onClick={onDismiss}
        aria-label="Cerrar alerta"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}