import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { RotateCcw, Loader2 } from "lucide-react";

interface DetalleFactura {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  itbis: number;
  subtotal: number;
  productos: { nombre: string } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facturaId: string;
  facturaNumero: string;
  clienteId: string;
  clienteNombre: string;
  onCreated: () => void;
}

export default function NotaCreditoModal({ open, onOpenChange, facturaId, facturaNumero, clienteId, clienteNombre, onCreated }: Props) {
  const { user } = useAuth();
  const [detalles, setDetalles] = useState<DetalleFactura[]>([]);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !facturaId) return;
    setLoading(true);
    setSelected({});
    setMotivo("");
    supabase
      .from("detalle_facturas")
      .select("id, producto_id, cantidad, precio_unitario, itbis, subtotal, productos(nombre)")
      .eq("factura_id", facturaId)
      .then(({ data }) => {
        setDetalles((data as any) || []);
        setLoading(false);
      });
  }, [open, facturaId]);

  const toggleItem = (detId: string, maxCant: number) => {
    setSelected(prev => {
      if (prev[detId] !== undefined) {
        const next = { ...prev };
        delete next[detId];
        return next;
      }
      return { ...prev, [detId]: maxCant };
    });
  };

  const updateCantidad = (detId: string, cant: number, max: number) => {
    setSelected(prev => ({ ...prev, [detId]: Math.min(Math.max(1, cant), max) }));
  };

  const totalDevolucion = detalles
    .filter(d => selected[d.id] !== undefined)
    .reduce((sum, d) => {
      const cant = selected[d.id];
      const unitTotal = d.subtotal / d.cantidad;
      return sum + unitTotal * cant;
    }, 0);

  const handleSubmit = async () => {
    if (!motivo.trim()) { toast.error("Ingrese el motivo de la devolución"); return; }
    const items = detalles.filter(d => selected[d.id] !== undefined);
    if (items.length === 0) { toast.error("Seleccione al menos un producto"); return; }

    setSaving(true);
    try {
      // Create nota de crédito
      const { data: nota, error: notaErr } = await supabase.from("notas_credito").insert({
        factura_id: facturaId,
        cliente_id: clienteId,
        motivo,
        total: totalDevolucion,
        usuario_id: user!.id,
      } as any).select().single();
      if (notaErr) throw notaErr;

      // Insert details
      const detallesInsert = items.map(d => ({
        nota_credito_id: nota.id,
        producto_id: d.producto_id,
        cantidad: selected[d.id],
        precio_unitario: d.precio_unitario,
        itbis: (d.itbis / d.cantidad) * selected[d.id],
        subtotal: (d.subtotal / d.cantidad) * selected[d.id],
      }));
      const { error: detErr } = await supabase.from("detalle_notas_credito").insert(detallesInsert as any);
      if (detErr) throw detErr;

      // Restore stock + register kardex for each product
      for (const d of items) {
        const cant = selected[d.id];
        // Get current stock
        const { data: prod } = await supabase.from("productos").select("stock, tipo").eq("id", d.producto_id).single();
        if (prod && prod.tipo !== "servicio") {
          const stockAnterior = prod.stock;
          const stockNuevo = stockAnterior + cant;
          await supabase.from("productos").update({ stock: stockNuevo } as any).eq("id", d.producto_id);
          await supabase.from("movimientos_inventario").insert({
            producto_id: d.producto_id,
            tipo_movimiento: "DEVOLUCION",
            cantidad: cant,
            stock_anterior: stockAnterior,
            stock_nuevo: stockNuevo,
            referencia: `NC de Factura ${facturaNumero}`,
            usuario_id: user!.id,
          } as any);
        }
      }

      // Audit
      await supabase.from("audit_logs").insert({
        user_id: user!.id,
        accion: "crear_nota_credito",
        entidad: "notas_credito",
        entidad_id: nota.id,
        detalles: { factura_id: facturaId, factura_numero: facturaNumero, total: totalDevolucion, items: items.length },
      } as any);

      toast.success(`Nota de crédito creada por RD$ ${totalDevolucion.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`);
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Error al crear nota de crédito");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            Nota de Crédito — Factura {facturaNumero}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">Cliente: <strong>{clienteNombre}</strong></p>

        <div className="space-y-3">
          <Label>Motivo de la devolución *</Label>
          <Textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej: Producto defectuoso, error en facturación..." rows={2} />
        </div>

        <ScrollArea className="max-h-[40vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Facturado</TableHead>
                <TableHead className="text-right">Devolver</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : detalles.map(d => {
                const isSelected = selected[d.id] !== undefined;
                const unitTotal = d.subtotal / d.cantidad;
                return (
                  <TableRow key={d.id} className={isSelected ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleItem(d.id, d.cantidad)} />
                    </TableCell>
                    <TableCell className="font-medium text-sm">{d.productos?.nombre || "—"}</TableCell>
                    <TableCell className="text-right">{d.cantidad}</TableCell>
                    <TableCell className="text-right">
                      {isSelected ? (
                        <Input
                          type="number" min={1} max={d.cantidad}
                          value={selected[d.id]}
                          onChange={e => updateCantidad(d.id, parseInt(e.target.value) || 1, d.cantidad)}
                          className="w-16 h-7 text-sm text-right"
                        />
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {isSelected ? `RD$ ${(unitTotal * selected[d.id]).toLocaleString("es-DO", { minimumFractionDigits: 2 })}` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Total devolución:</span>
          <span className="text-xl font-bold text-primary">
            RD$ {totalDevolucion.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <Button onClick={handleSubmit} disabled={saving} className="w-full">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
          Generar Nota de Crédito
        </Button>
      </DialogContent>
    </Dialog>
  );
}
