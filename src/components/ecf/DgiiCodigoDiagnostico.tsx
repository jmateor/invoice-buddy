import { diagnosticarCodigoDgii } from "@/lib/dgiiCodeDiagnostics";
import { AlertCircle, AlertTriangle, Info, Lightbulb } from "lucide-react";

interface Props {
  codigo?: string | null;
  className?: string;
}

const SEVERITY_STYLES = {
  error: "border-destructive/40 bg-destructive/5 text-destructive",
  warning: "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400",
  info: "border-sky-500/40 bg-sky-500/5 text-sky-700 dark:text-sky-400",
};

const SEVERITY_ICON = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function DgiiCodigoDiagnostico({ codigo, className }: Props) {
  const diag = diagnosticarCodigoDgii(codigo);
  if (!diag) return null;
  const Icon = SEVERITY_ICON[diag.severidad];
  return (
    <div className={`mt-2 rounded-lg border p-3 text-xs space-y-2 ${SEVERITY_STYLES[diag.severidad]} ${className ?? ""}`}>
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold text-sm">{diag.titulo}</div>
          <div className="opacity-80 mt-0.5"><strong>Código:</strong> {diag.codigo}</div>
        </div>
      </div>
      <div>
        <div className="font-medium mb-0.5">Causa probable</div>
        <p className="opacity-90">{diag.causa}</p>
      </div>
      <div>
        <div className="font-medium mb-1">Cómo corregirlo</div>
        <ol className="list-decimal list-inside space-y-0.5 opacity-90">
          {diag.acciones.map((a, i) => <li key={i}>{a}</li>)}
        </ol>
      </div>
      {diag.ejemplo && (
        <div className="flex items-start gap-2 pt-1 border-t border-current/10">
          <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <p className="opacity-90"><strong>{diag.ejemplo}</strong></p>
        </div>
      )}
    </div>
  );
}