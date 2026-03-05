import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Package, AlertTriangle, ShieldCheck, Wrench, Barcode, Printer } from "lucide-react";
import BarcodePrintModal from "@/components/BarcodePrintModal";

interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  costo: number;
  stock: number;
  stock_minimo: number;
  itbis_aplicable: boolean;
  categoria_id: string | null;
  garantia_descripcion: string | null;
  condiciones_garantia: string | null;
  tipo: string;
  codigo_barras: string | null;
}

const generateBarcode = () => {
  // EAN-13 style: 13-digit numeric code
  const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
  const sum = digits.reduce((s, d, i) => s + d * (i % 2 === 0 ? 1 : 3), 0);
  digits.push((10 - (sum % 10)) % 10);
  return digits.join("");
};

const emptyForm = {
  nombre: "",
  descripcion: "",
  precio: "0",
  costo: "0",
  stock: "0",
  stock_minimo: "5",
  itbis_aplicable: true,
  garantia_descripcion: "",
  condiciones_garantia: "",
  tipo: "producto",
  codigo_barras: "",
};

export default function Productos() {
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [barcodePrint, setBarcodePrint] = useState<{ codigo: string; nombre: string; precio: number } | null>(null);

  const load = async () => {
    const { data } = await supabase.from("productos").select("*").order("nombre");
    setProductos((data as any) || []);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    const isService = form.tipo === "servicio";
    const codigo = form.codigo_barras?.trim() || generateBarcode();

    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      precio: parseFloat(form.precio) || 0,
      costo: isService ? 0 : (parseFloat(form.costo) || 0),
      stock: isService ? 0 : (parseInt(form.stock) || 0),
      stock_minimo: isService ? 0 : (parseInt(form.stock_minimo) || 5),
      itbis_aplicable: form.itbis_aplicable,
      garantia_descripcion: form.garantia_descripcion?.trim() || null,
      condiciones_garantia: form.condiciones_garantia?.trim() || null,
      tipo: form.tipo,
      codigo_barras: codigo,
    };

    if (editing) {
      const { error } = await supabase.from("productos").update(payload as any).eq("id", editing);
      if (error) { toast.error(error.message); return; }
      toast.success("Producto actualizado");
    } else {
      const { error } = await supabase.from("productos").insert({ ...payload, user_id: user!.id } as any);
      if (error) {
        if (error.message.includes("duplicate") || error.message.includes("unique")) {
          toast.error("El código de barras ya existe. Intente con otro.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success("Producto creado");
      // Offer to print barcode
      setBarcodePrint({ codigo, nombre: form.nombre, precio: parseFloat(form.precio) || 0 });
    }
    setOpen(false); setEditing(null); setForm(emptyForm); load();
  };

  const handleEdit = (p: Producto) => {
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || "",
      precio: String(p.precio),
      costo: String(p.costo),
      stock: String(p.stock),
      stock_minimo: String(p.stock_minimo),
      itbis_aplicable: p.itbis_aplicable,
      garantia_descripcion: p.garantia_descripcion || "",
      condiciones_garantia: p.condiciones_garantia || "",
      tipo: p.tipo || "producto",
      codigo_barras: p.codigo_barras || "",
    });
    setEditing(p.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const { error } = await supabase.from("productos").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Producto eliminado"); load();
  };

  const filtered = productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (p.codigo_barras || "").toLowerCase().includes(search.toLowerCase())
  );
  const isService = form.tipo === "servicio";

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Productos y Servicios</h1>
          <p className="text-muted-foreground">{productos.length} registrados</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nuevo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar" : "Nuevo"} {isService ? "Servicio" : "Producto"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Tipo */}
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="producto">📦 Producto</SelectItem>
                    <SelectItem value="servicio">🔧 Servicio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Código de barras */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Barcode className="h-4 w-4" /> Código de Barras
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={form.codigo_barras}
                    onChange={e => setForm(f => ({ ...f, codigo_barras: e.target.value }))}
                    placeholder="Se genera automáticamente si se deja vacío"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, codigo_barras: generateBarcode() }))}>
                    Generar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Escanee o escriba el código. Si está vacío se generará automáticamente.</p>
              </div>

              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precio (RD$)</Label>
                  <Input type="number" step="0.01" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
                </div>
                {!isService && (
                  <div className="space-y-2">
                    <Label>Costo (RD$)</Label>
                    <Input type="number" step="0.01" value={form.costo} onChange={e => setForm(f => ({ ...f, costo: e.target.value }))} />
                  </div>
                )}
              </div>
              {!isService && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Mínimo</Label>
                    <Input type="number" value={form.stock_minimo} onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))} />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch checked={form.itbis_aplicable} onCheckedChange={v => setForm(f => ({ ...f, itbis_aplicable: v }))} />
                <Label>Aplica ITBIS (18%)</Label>
              </div>

              {/* Garantía */}
              <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold">Garantía</Label>
                </div>
                <div className="space-y-2">
                  <Input
                    value={form.garantia_descripcion}
                    onChange={e => setForm(f => ({ ...f, garantia_descripcion: e.target.value }))}
                    placeholder="Ej: 12 meses contra defectos de fábrica"
                  />
                  <Textarea
                    value={form.condiciones_garantia}
                    onChange={e => setForm(f => ({ ...f, condiciones_garantia: e.target.value }))}
                    placeholder="Condiciones detalladas de la garantía (aparecerán en la factura)..."
                    rows={3}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Estos textos aparecerán en la factura PDF junto al {isService ? "servicio" : "producto"}.
                </p>
              </div>

              <Button onClick={handleSave} className="w-full">{editing ? "Actualizar" : "Crear"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nombre o código de barras..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>ITBIS</TableHead>
                <TableHead>Garantía</TableHead>
                <TableHead className="w-28">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No hay productos
                  </TableCell>
                </TableRow>
              ) : filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{p.codigo_barras || "—"}</code>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {p.nombre}
                      {p.tipo !== "servicio" && p.stock <= p.stock_minimo && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    {p.descripcion && <p className="text-xs text-muted-foreground">{p.descripcion}</p>}
                  </TableCell>
                  <TableCell>
                    {p.tipo === "servicio" ? (
                      <Badge variant="outline" className="gap-1"><Wrench className="h-3 w-3" />Servicio</Badge>
                    ) : (
                      <Badge variant="secondary">Producto</Badge>
                    )}
                  </TableCell>
                  <TableCell>RD$ {Number(p.precio).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    {p.tipo === "servicio" ? (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    ) : (
                      <Badge variant={p.stock <= p.stock_minimo ? "destructive" : "secondary"}>
                        {p.stock}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{p.itbis_aplicable ? "Sí" : "No"}</TableCell>
                  <TableCell>
                    {p.garantia_descripcion ? (
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs text-muted-foreground max-w-[120px] truncate">{p.garantia_descripcion}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {p.codigo_barras && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Imprimir código de barras"
                          onClick={() => setBarcodePrint({ codigo: p.codigo_barras!, nombre: p.nombre, precio: p.precio })}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {barcodePrint && (
        <BarcodePrintModal
          open={!!barcodePrint}
          onOpenChange={(o) => { if (!o) setBarcodePrint(null); }}
          codigo={barcodePrint.codigo}
          nombre={barcodePrint.nombre}
          precio={barcodePrint.precio}
        />
      )}
    </div>
  );
}
