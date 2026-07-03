import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Rocket, RefreshCw } from "lucide-react";
import { useEcfProduccionChecklist } from "@/hooks/useEcfProduccionChecklist";

interface Props {
  userId?: string;
  refreshKey?: number;
}

export default function EcfProduccionChecklist({ userId, refreshKey }: Props) {
  const {
    checks,
    loading,
    total,
    listos,
    bloqueantesPendientes,
    pct,
    listoParaProd,
    refresh,
  } = useEcfProduccionChecklist(userId, refreshKey);

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
        <Button variant="outline" size="sm" onClick={() => useEcfProduccionChecklist(userId, refreshKey)} disabled={loading}>
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
              <div className="mt-0.5">
                {c.estado === "ok" && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                {c.estado === "warn" && <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                {c.estado === "fail" && <XCircle className="h-4 w-4 text-destructive" />}
                {c.estado === "loading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
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
