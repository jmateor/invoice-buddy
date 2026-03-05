import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";
import { useRef, useState } from "react";
import Barcode from "react-barcode";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codigo: string;
  nombre: string;
  precio?: number;
}

export default function BarcodePrintModal({ open, onOpenChange, codigo, nombre, precio }: Props) {
  const [cantidad, setCantidad] = useState(1);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=400,height=400");
    if (!w) return;

    const labels = Array.from({ length: cantidad })
      .map(
        () => `
        <div style="display:inline-block;text-align:center;padding:6px 10px;border:1px dashed #ccc;margin:4px;page-break-inside:avoid;">
          <div style="font-size:10px;font-weight:bold;margin-bottom:2px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${nombre}</div>
          <svg id="bc-${Math.random().toString(36).slice(2)}"></svg>
          <div style="font-size:9px;margin-top:1px;">${codigo}</div>
          ${precio != null ? `<div style="font-size:11px;font-weight:bold;margin-top:2px;">RD$ ${precio.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</div>` : ""}
        </div>`
      )
      .join("");

    w.document.write(`<!DOCTYPE html><html><head>
      <title>Etiquetas</title>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
        @media print { body { margin: 0; padding: 0; } }
      </style>
    </head><body>${labels}</body>
    <script>
      document.querySelectorAll('svg[id^="bc-"]').forEach(el => {
        JsBarcode(el, "${codigo}", { width: 1.5, height: 40, fontSize: 0, margin: 0 });
      });
      setTimeout(() => window.print(), 300);
    <\/script></html>`);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Imprimir Código de Barras</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center p-4 bg-muted/30 rounded-lg border border-border">
            <div className="text-center">
              <p className="text-xs font-medium text-foreground mb-1 truncate max-w-[200px]">{nombre}</p>
              <Barcode value={codigo} width={1.5} height={40} fontSize={10} margin={0} />
              {precio != null && (
                <p className="text-sm font-bold text-primary mt-1">
                  RD$ {precio.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cantidad de etiquetas</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <Button onClick={handlePrint} className="w-full">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir {cantidad} etiqueta{cantidad > 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
