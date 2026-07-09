import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, XCircle, Banknote, CreditCard, ArrowRightLeft, RotateCcw, Split } from "lucide-react";

export interface DesglosePago {
  monto_efectivo: number;
  monto_tarjeta: number;
  monto_cheque: number;
  monto_credito: number;
  monto_bonos: number;
  monto_permuta: number;
  monto_otros: number;
  metodo_efectivo?: string; // "mixto" | original
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  itbis: number;
  descuento: number;
  total: number;
  metodoPago: string;
  onConfirm: (desglose: DesglosePago) => void;
  saving: boolean;
  notaCreditoMonto?: number;
}

const METODO_ICONS: Record<string, { icon: typeof Banknote; label: string }> = {
  efectivo: { icon: Banknote, label: "Efectivo" },
  tarjeta: { icon: CreditCard, label: "Tarjeta" },
  transferencia: { icon: ArrowRightLeft, label: "Transferencia" },
  nota_credito: { icon: RotateCcw, label: "Nota de Crédito" },
};

const fmt = (n: number) =>
  `RD$ ${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

const emptyDesglose = (): DesglosePago => ({
  monto_efectivo: 0, monto_tarjeta: 0, monto_cheque: 0,
  monto_credito: 0, monto_bonos: 0, monto_permuta: 0, monto_otros: 0,
});

export default function PaymentModal({
  open,
  onOpenChange,
  subtotal,
  itbis,
  descuento,
  total,
  metodoPago,
  onConfirm,
  saving,
  notaCreditoMonto = 0,
}: PaymentModalProps) {
  const [montoRecibido, setMontoRecibido] = useState("");
  const [mixto, setMixto] = useState(false);
  const [dg, setDg] = useState<DesglosePago>(emptyDesglose());
  const inputRef = useRef<HTMLInputElement>(null);
  const isEfectivo = metodoPago === "efectivo";
  const isNotaCredito = metodoPago === "nota_credito";
  const monto = parseFloat(montoRecibido) || 0;
  const cambio = monto - total;
  const sumaDesglose = dg.monto_efectivo + dg.monto_tarjeta + dg.monto_cheque + dg.monto_credito + dg.monto_bonos + dg.monto_permuta + dg.monto_otros;
  const mixtoValid = mixto ? Math.abs(sumaDesglose - total) < 0.01 : true;
  const isValid = mixto
    ? mixtoValid
    : isNotaCredito
      ? notaCreditoMonto >= total
      : isEfectivo
        ? monto >= total
        : true;
  const metodoInfo = METODO_ICONS[metodoPago] || METODO_ICONS.efectivo;
  const MetodoIcon = metodoInfo.icon;

  useEffect(() => {
    if (open) {
      setMontoRecibido("");
      setMixto(false);
      setDg(emptyDesglose());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const buildSingleDesglose = (): DesglosePago => {
    const d = emptyDesglose();
    if (metodoPago === "efectivo") d.monto_efectivo = total;
    else if (metodoPago === "tarjeta") d.monto_tarjeta = total;
    else if (metodoPago === "transferencia") d.monto_cheque = total; // Formato DGII combina cheque/transferencia
    else if (metodoPago === "nota_credito") d.monto_bonos = total;
    else d.monto_otros = total;
    return d;
  };

  const handleConfirm = () => {
    if (!isValid || saving) return;
    onConfirm(mixto ? { ...dg, metodo_efectivo: "mixto" } : buildSingleDesglose());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid && !saving) {
      handleConfirm();
    }
  };

  const setDgField = (k: keyof DesglosePago, v: string) =>
    setDg({ ...dg, [k]: parseFloat(v) || 0 });

  const camposMixto: { key: keyof DesglosePago; label: string }[] = [
    { key: "monto_efectivo", label: "Efectivo" },
    { key: "monto_tarjeta", label: "Tarjeta" },
    { key: "monto_cheque", label: "Cheque / Transferencia" },
    { key: "monto_credito", label: "Crédito" },
    { key: "monto_bonos", label: "Bonos / Nota crédito" },
    { key: "monto_permuta", label: "Permuta" },
    { key: "monto_otros", label: "Otros" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Banknote className="h-5 w-5 text-primary" />
            Confirmar Cobro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-lg border border-border p-4 space-y-2 bg-muted/30">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {itbis > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>ITBIS (18%)</span>
                <span>{fmt(itbis)}</span>
              </div>
            )}
            {descuento > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Descuento</span>
                <span className="text-destructive">-{fmt(descuento)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-2xl font-bold text-foreground">
              <span>Total</span>
              <span className="text-primary">{fmt(total)}</span>
            </div>
          </div>

          {/* Payment method badge */}
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-sm gap-1.5 px-3 py-1.5">
              <MetodoIcon className="h-4 w-4" />
              Método: {metodoInfo.label}
            </Badge>
            <div className="flex items-center gap-1 text-xs">
              <Split className="h-3 w-3" />
              <Label htmlFor="mixto-switch" className="cursor-pointer">Pago mixto</Label>
              <Switch id="mixto-switch" checked={mixto} onCheckedChange={setMixto} />
            </div>
          </div>

          {/* Mixed payment breakdown */}
          {mixto && (
            <div className="space-y-2 border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Desglose para reporte 607 (DGII)</p>
              <div className="grid grid-cols-2 gap-2">
                {camposMixto.map(c => (
                  <div key={c.key} className="space-y-1">
                    <Label className="text-xs">{c.label}</Label>
                    <Input type="number" step="0.01" min="0"
                      value={(dg[c.key] as number) || ""}
                      onChange={e => setDgField(c.key, e.target.value)}
                      placeholder="0.00"
                      className="h-9" />
                  </div>
                ))}
              </div>
              <div className={`flex justify-between text-sm pt-2 border-t ${mixtoValid ? "text-green-600" : "text-destructive"}`}>
                <span>Suma: {fmt(sumaDesglose)}</span>
                <span>
                  {mixtoValid ? "✓ Cuadra" : `Diferencia: ${fmt(sumaDesglose - total)}`}
                </span>
              </div>
            </div>
          )}

          {/* Amount received - only for cash */}
          {isEfectivo && !mixto && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Monto Recibido
              </label>
              <Input
                ref={inputRef}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                className="h-14 text-2xl text-center font-bold"
                autoFocus
              />

              {/* Change display */}
              <div
                className={`rounded-lg p-4 text-center transition-colors ${
                  montoRecibido === ""
                    ? "bg-muted/50"
                    : cambio >= 0
                    ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                    : "bg-destructive/10 border border-destructive/20"
                }`}
              >
                {montoRecibido === "" ? (
                  <p className="text-sm text-muted-foreground">
                    Ingrese el monto recibido
                  </p>
                ) : cambio >= 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Cambio a devolver
                    </p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {fmt(cambio)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-destructive uppercase tracking-wide">
                      Monto insuficiente
                    </p>
                    <p className="text-xl font-bold text-destructive">
                      Faltan {fmt(Math.abs(cambio))}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* For nota de crédito */}
          {isNotaCredito && !mixto && (
            <div className={`rounded-lg p-4 text-center border ${notaCreditoMonto >= total ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" : "bg-destructive/10 border-destructive/20"}`}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Crédito disponible del cliente</p>
              <p className={`text-2xl font-bold ${notaCreditoMonto >= total ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                {fmt(notaCreditoMonto)}
              </p>
              {notaCreditoMonto < total && (
                <p className="text-xs text-destructive mt-1">Crédito insuficiente. Faltan {fmt(total - notaCreditoMonto)}</p>
              )}
              {notaCreditoMonto >= total && notaCreditoMonto - total > 0 && (
                <p className="text-xs text-muted-foreground mt-1">Crédito restante después: {fmt(notaCreditoMonto - total)}</p>
              )}
            </div>
          )}

          {/* For non-cash, non-NC methods */}
          {!isEfectivo && !isNotaCredito && !mixto && (
            <div className="rounded-lg p-4 text-center bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                Pago por {metodoInfo.label.toLowerCase()} — no requiere cambio
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || saving}
            className="min-w-[160px]"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {saving ? "Procesando..." : "Confirmar Pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
