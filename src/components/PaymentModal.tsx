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
import { CheckCircle, XCircle, Banknote, CreditCard, ArrowRightLeft, RotateCcw } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  itbis: number;
  descuento: number;
  total: number;
  metodoPago: string;
  onConfirm: () => void;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const isEfectivo = metodoPago === "efectivo";
  const monto = parseFloat(montoRecibido) || 0;
  const cambio = monto - total;
  const isValid = isEfectivo ? monto >= total : true;
  const metodoInfo = METODO_ICONS[metodoPago] || METODO_ICONS.efectivo;
  const MetodoIcon = metodoInfo.icon;

  useEffect(() => {
    if (open) {
      setMontoRecibido("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid && !saving) {
      onConfirm();
    }
  };

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
          <div className="flex items-center justify-center">
            <Badge variant="outline" className="text-sm gap-1.5 px-3 py-1.5">
              <MetodoIcon className="h-4 w-4" />
              Método: {metodoInfo.label}
            </Badge>
          </div>

          {/* Amount received - only for cash */}
          {isEfectivo && (
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

          {/* For non-cash methods */}
          {!isEfectivo && (
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
            onClick={onConfirm}
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
