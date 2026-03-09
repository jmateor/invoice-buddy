import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardList } from "lucide-react";

interface Movimiento {
  id: string;
  tipo_movimiento: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  referencia: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productoId: string;
  productoNombre: string;
}

const TIPO_COLORS: Record<string, string> = {
  VENTA: "destructive",
  COMPRA: "default",
  AJUSTE: "secondary",
  DEVOLUCION: "outline",
  SERVICIO: "secondary",
};

export default function KardexModal({ open, onOpenChange, productoId, productoNombre }: Props) {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !productoId) return;
    setLoading(true);
    supabase
      .from("movimientos_inventario")
      .select("*")
      .eq("producto_id", productoId)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setMovimientos((data as any) || []);
        setLoading(false);
      });
  }, [open, productoId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Kardex: {productoNombre}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Movimiento</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Stock Anterior</TableHead>
                <TableHead className="text-right">Stock Nuevo</TableHead>
                <TableHead>Referencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell>
                </TableRow>
              ) : movimientos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Sin movimientos registrados
                  </TableCell>
                </TableRow>
              ) : movimientos.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs">
                    {new Date(m.created_at).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={TIPO_COLORS[m.tipo_movimiento] as any || "secondary"}>
                      {m.tipo_movimiento}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={m.cantidad > 0 ? "text-accent" : "text-destructive"}>
                      {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{m.stock_anterior}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{m.stock_nuevo}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{m.referencia || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
