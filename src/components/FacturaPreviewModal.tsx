import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface FacturaPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factura: {
    id: string;
    numero: string;
    fecha: string;
    subtotal: number;
    itbis: number;
    descuento: number;
    total: number;
    metodo_pago: string;
    estado: string;
    notas: string | null;
    clientes: { nombre: string; rnc_cedula: string | null; direccion: string | null; telefono: string | null; email: string | null } | null;
  };
  negocio?: { nombre_comercial: string; rnc?: string | null; direccion?: string | null; telefono?: string | null } | null;
}

interface Detalle {
  cantidad: number;
  precio_unitario: number;
  itbis: number;
  subtotal: number;
  productos: { nombre: string } | null;
}

const metodoPagoLabel: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  nota_credito: "Nota de Crédito",
};

export default function FacturaPreviewModal({ open, onOpenChange, factura, negocio }: FacturaPreviewProps) {
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("detalle_facturas")
      .select("cantidad, precio_unitario, itbis, subtotal, productos(nombre)")
      .eq("factura_id", factura.id)
      .then(({ data }) => {
        setDetalles((data as any) || []);
        setLoading(false);
      });
  }, [open, factura.id]);

  const fmt = (n: number) => `RD$ ${Number(n).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Factura {factura.numero}
            <Badge variant={factura.estado === "activa" ? "default" : "destructive"}>
              {factura.estado === "activa" ? "Activa" : "Anulada"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              {negocio && (
                <>
                  <p className="font-semibold text-foreground">{negocio.nombre_comercial}</p>
                  {negocio.rnc && <p className="text-xs text-muted-foreground">RNC: {negocio.rnc}</p>}
                  {negocio.direccion && <p className="text-xs text-muted-foreground">{negocio.direccion}</p>}
                  {negocio.telefono && <p className="text-xs text-muted-foreground">Tel: {negocio.telefono}</p>}
                </>
              )}
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">
                Fecha: {new Date(factura.fecha).toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
              <p className="text-sm text-muted-foreground">
                Método: {metodoPagoLabel[factura.metodo_pago] || factura.metodo_pago}
              </p>
            </div>
          </div>

          <Separator />

          {/* Client */}
          <div className="rounded-md border border-border p-3 space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase">Cliente</p>
            <p className="font-medium text-foreground">{factura.clientes?.nombre || "—"}</p>
            {factura.clientes?.rnc_cedula && <p className="text-sm text-muted-foreground">RNC/Cédula: {factura.clientes.rnc_cedula}</p>}
            {factura.clientes?.direccion && <p className="text-sm text-muted-foreground">{factura.clientes.direccion}</p>}
            {factura.clientes?.telefono && <p className="text-sm text-muted-foreground">Tel: {factura.clientes.telefono}</p>}
            {factura.clientes?.email && <p className="text-sm text-muted-foreground">{factura.clientes.email}</p>}
          </div>

          {/* Details table */}
          {loading ? (
            <p className="text-center text-muted-foreground py-4">Cargando detalles...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">ITBIS</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detalles.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell>{d.productos?.nombre || "—"}</TableCell>
                    <TableCell className="text-center">{d.cantidad}</TableCell>
                    <TableCell className="text-right">{fmt(d.precio_unitario)}</TableCell>
                    <TableCell className="text-right">{fmt(d.itbis)}</TableCell>
                    <TableCell className="text-right">{fmt(d.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{fmt(factura.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ITBIS</span>
                <span>{fmt(factura.itbis)}</span>
              </div>
              {Number(factura.descuento) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="text-destructive">-{fmt(factura.descuento)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{fmt(factura.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {factura.notas && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Notas</p>
              <p className="text-sm text-foreground">{factura.notas}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
