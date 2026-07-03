import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Rocket } from "lucide-react";
import { useEcfProduccionChecklist } from "@/hooks/useEcfProduccionChecklist";

interface Props {
  userId?: string;
  refreshKey?: number;
}

export default function EcfProduccionResumen({ userId, refreshKey }: Props) {
  const {
    checks,
    loading,
    listos,
    bloqueantesPendientes,
    pct,
    listoParaProd,
  } = useEcfProduccionChecklist(userId, refreshKey);

  const bloqueantes = checks.filter((c) => c.bloqueante && c.estado !== "ok");

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-4 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verificando readiness para producción…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border ${listoParaProd ? "border-emerald-500/30 bg-emerald-500/5" : bloqueantesPendientes > 0 ? "border-destructive/20 bg-destructive/5" : "border-border"}`}>
      <CardContent className="py-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 shrink-0">
            <Rocket className={`h-4 w-4 ${listoParaProd ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`} />
            <span className="text-sm font-medium">Readiness Producción</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-muted-foreground text-xs">{listos} de {checks.length} puntos listos</span>
              <Badge
                variant={listoParaProd ? "default" : bloqueantesPendientes > 0 ? "destructive" : "secondary"}
                className="text-[10px]"
              >
                {listoParaProd
                  ? "✅ Listo"
                  : `${bloqueantesPendientes} bloqueante${bloqueantesPendientes === 1 ? "" : "s"}`}
              </Badge>
            </div>
            <Progress
              value={pct}
              className={`h-2 ${listoParaProd ? "[&>div]:bg-emerald-500" : bloqueantesPendientes > 0 ? "[&>div]:bg-destructive" : ""}`}
            />
          </div>
        </div>

        {bloqueantes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {bloqueantes.map((c) => (
              <Badge
                key={c.id}
                variant="outline"
                className={`text-[10px] flex items-center gap-1 ${
                  c.estado === "warn"
                    ? "border-amber-500/40 text-amber-700 dark:text-amber-400"
                    : "border-destructive/40 text-destructive"
                }`}
              >
                {c.estado === "warn" ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {c.titulo}
              </Badge>
            ))}
          </div>
        )}

        {listoParaProd && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Todos los bloqueantes resueltos. Puedes solicitar el paso a Producción en la DGII.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
