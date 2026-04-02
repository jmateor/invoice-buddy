
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
import { Plus, Pencil, Trash2, Search, Package, AlertTriangle, ShieldCheck, Wrench, Barcode, Printer, ClipboardList } from "lucide-react";
import BarcodePrintModal from "@/components/BarcodePrintModal";
import KardexModal from "@/components/KardexModal";
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
interface Categoria {
import { traducirError } from "@/lib/errorTranslator";
  id: string;
import { traducirError } from "@/lib/errorTranslator";
  nombre: string;
import { traducirError } from "@/lib/errorTranslator";
}
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
interface Producto {
import { traducirError } from "@/lib/errorTranslator";
  id: string;
import { traducirError } from "@/lib/errorTranslator";
  nombre: string;
import { traducirError } from "@/lib/errorTranslator";
  descripcion: string | null;
import { traducirError } from "@/lib/errorTranslator";
  precio: number;
import { traducirError } from "@/lib/errorTranslator";
  costo: number;
import { traducirError } from "@/lib/errorTranslator";
  stock: number;
import { traducirError } from "@/lib/errorTranslator";
  stock_minimo: number;
import { traducirError } from "@/lib/errorTranslator";
  itbis_aplicable: boolean;
import { traducirError } from "@/lib/errorTranslator";
  categoria_id: string | null;
import { traducirError } from "@/lib/errorTranslator";
  garantia_descripcion: string | null;
import { traducirError } from "@/lib/errorTranslator";
  condiciones_garantia: string | null;
import { traducirError } from "@/lib/errorTranslator";
  tipo: string;
import { traducirError } from "@/lib/errorTranslator";
  codigo_barras: string | null;
import { traducirError } from "@/lib/errorTranslator";
}
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
const generateBarcode = () => {
import { traducirError } from "@/lib/errorTranslator";
  // EAN-13 style: 13-digit numeric code
import { traducirError } from "@/lib/errorTranslator";
  const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
import { traducirError } from "@/lib/errorTranslator";
  const sum = digits.reduce((s, d, i) => s + d * (i % 2 === 0 ? 1 : 3), 0);
import { traducirError } from "@/lib/errorTranslator";
  digits.push((10 - (sum % 10)) % 10);
import { traducirError } from "@/lib/errorTranslator";
  return digits.join("");
import { traducirError } from "@/lib/errorTranslator";
};
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
const emptyForm = {
import { traducirError } from "@/lib/errorTranslator";
  nombre: "",
import { traducirError } from "@/lib/errorTranslator";
  descripcion: "",
import { traducirError } from "@/lib/errorTranslator";
  precio: "0",
import { traducirError } from "@/lib/errorTranslator";
  costo: "0",
import { traducirError } from "@/lib/errorTranslator";
  stock: "0",
import { traducirError } from "@/lib/errorTranslator";
  stock_minimo: "5",
import { traducirError } from "@/lib/errorTranslator";
  itbis_aplicable: true,
import { traducirError } from "@/lib/errorTranslator";
  garantia_descripcion: "",
import { traducirError } from "@/lib/errorTranslator";
  condiciones_garantia: "",
import { traducirError } from "@/lib/errorTranslator";
  tipo: "producto",
import { traducirError } from "@/lib/errorTranslator";
  codigo_barras: "",
import { traducirError } from "@/lib/errorTranslator";
  categoria_id: "",
import { traducirError } from "@/lib/errorTranslator";
};
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
export default function Productos() {
import { traducirError } from "@/lib/errorTranslator";
  const { user } = useAuth();
import { traducirError } from "@/lib/errorTranslator";
  const [productos, setProductos] = useState<Producto[]>([]);
import { traducirError } from "@/lib/errorTranslator";
  const [categorias, setCategorias] = useState<Categoria[]>([]);
import { traducirError } from "@/lib/errorTranslator";
  const [search, setSearch] = useState("");
import { traducirError } from "@/lib/errorTranslator";
  const [open, setOpen] = useState(false);
import { traducirError } from "@/lib/errorTranslator";
  const [editing, setEditing] = useState<string | null>(null);
import { traducirError } from "@/lib/errorTranslator";
  const [form, setForm] = useState(emptyForm);
import { traducirError } from "@/lib/errorTranslator";
  const [barcodePrint, setBarcodePrint] = useState<{ codigo: string; nombre: string; precio: number } | null>(null);
import { traducirError } from "@/lib/errorTranslator";
  const [kardex, setKardex] = useState<{ id: string; nombre: string } | null>(null);
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const load = async () => {
import { traducirError } from "@/lib/errorTranslator";
    const [prodRes, catRes] = await Promise.all([
import { traducirError } from "@/lib/errorTranslator";
      supabase.from("productos").select("*").order("nombre"),
import { traducirError } from "@/lib/errorTranslator";
      supabase.from("categorias").select("id, nombre").order("nombre"),
import { traducirError } from "@/lib/errorTranslator";
    ]);
import { traducirError } from "@/lib/errorTranslator";
    setProductos((prodRes.data as any) || []);
import { traducirError } from "@/lib/errorTranslator";
    setCategorias((catRes.data as any) || []);
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  useEffect(() => { if (user) load(); }, [user]);
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleSave = async () => {
import { traducirError } from "@/lib/errorTranslator";
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
import { traducirError } from "@/lib/errorTranslator";
    if (!form.categoria_id) { toast.error("Seleccione una categoría"); return; }
import { traducirError } from "@/lib/errorTranslator";
    const isService = form.tipo === "servicio";
import { traducirError } from "@/lib/errorTranslator";
    const codigo = form.codigo_barras?.trim() || generateBarcode();
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
    const payload = {
import { traducirError } from "@/lib/errorTranslator";
      nombre: form.nombre,
import { traducirError } from "@/lib/errorTranslator";
      descripcion: form.descripcion || null,
import { traducirError } from "@/lib/errorTranslator";
      precio: parseFloat(form.precio) || 0,
import { traducirError } from "@/lib/errorTranslator";
      costo: isService ? 0 : (parseFloat(form.costo) || 0),
import { traducirError } from "@/lib/errorTranslator";
      stock: isService ? 0 : (parseInt(form.stock) || 0),
import { traducirError } from "@/lib/errorTranslator";
      stock_minimo: isService ? 0 : (parseInt(form.stock_minimo) || 5),
import { traducirError } from "@/lib/errorTranslator";
      itbis_aplicable: form.itbis_aplicable,
import { traducirError } from "@/lib/errorTranslator";
      garantia_descripcion: form.garantia_descripcion?.trim() || null,
import { traducirError } from "@/lib/errorTranslator";
      condiciones_garantia: form.condiciones_garantia?.trim() || null,
import { traducirError } from "@/lib/errorTranslator";
      tipo: form.tipo,
import { traducirError } from "@/lib/errorTranslator";
      codigo_barras: codigo,
import { traducirError } from "@/lib/errorTranslator";
      categoria_id: form.categoria_id,
import { traducirError } from "@/lib/errorTranslator";
    };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
    if (editing) {
import { traducirError } from "@/lib/errorTranslator";
      const { error } = await supabase.from("productos").update(payload as any).eq("id", editing);
import { traducirError } from "@/lib/errorTranslator";
      if (error) { toast.error(error.message); return; }
import { traducirError } from "@/lib/errorTranslator";
      toast.success("Producto actualizado");
import { traducirError } from "@/lib/errorTranslator";
      await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
        user_id: user!.id,
import { traducirError } from "@/lib/errorTranslator";
        accion: "actualizar_producto",
import { traducirError } from "@/lib/errorTranslator";
        entidad: "productos",
import { traducirError } from "@/lib/errorTranslator";
        entidad_id: editing,
import { traducirError } from "@/lib/errorTranslator";
        detalles: { payload }
import { traducirError } from "@/lib/errorTranslator";
      } as any);
import { traducirError } from "@/lib/errorTranslator";
    } else {
import { traducirError } from "@/lib/errorTranslator";
      const { data, error } = await supabase.from("productos").insert({ ...payload, user_id: user!.id } as any).select("id").single();
import { traducirError } from "@/lib/errorTranslator";
      if (error) {
import { traducirError } from "@/lib/errorTranslator";
        if (error.message.includes("duplicate") || error.message.includes("unique")) {
import { traducirError } from "@/lib/errorTranslator";
          toast.error("El código de barras ya existe. Intente con otro.");
import { traducirError } from "@/lib/errorTranslator";
        } else {
import { traducirError } from "@/lib/errorTranslator";
          toast.error(error.message);
import { traducirError } from "@/lib/errorTranslator";
        }
import { traducirError } from "@/lib/errorTranslator";
        return;
import { traducirError } from "@/lib/errorTranslator";
      }
import { traducirError } from "@/lib/errorTranslator";
      toast.success("Producto creado");
import { traducirError } from "@/lib/errorTranslator";
      await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
        user_id: user!.id,
import { traducirError } from "@/lib/errorTranslator";
        accion: "crear_producto",
import { traducirError } from "@/lib/errorTranslator";
        entidad: "productos",
import { traducirError } from "@/lib/errorTranslator";
        entidad_id: data.id,
import { traducirError } from "@/lib/errorTranslator";
        detalles: { payload }
import { traducirError } from "@/lib/errorTranslator";
      } as any);
import { traducirError } from "@/lib/errorTranslator";
      // Offer to print barcode
import { traducirError } from "@/lib/errorTranslator";
      setBarcodePrint({ codigo, nombre: form.nombre, precio: parseFloat(form.precio) || 0 });
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";
    setOpen(false); setEditing(null); setForm(emptyForm); load();
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleEdit = (p: Producto) => {
import { traducirError } from "@/lib/errorTranslator";
    setForm({
import { traducirError } from "@/lib/errorTranslator";
      nombre: p.nombre,
import { traducirError } from "@/lib/errorTranslator";
      descripcion: p.descripcion || "",
import { traducirError } from "@/lib/errorTranslator";
      precio: String(p.precio),
import { traducirError } from "@/lib/errorTranslator";
      costo: String(p.costo),
import { traducirError } from "@/lib/errorTranslator";
      stock: String(p.stock),
import { traducirError } from "@/lib/errorTranslator";
      stock_minimo: String(p.stock_minimo),
import { traducirError } from "@/lib/errorTranslator";
      itbis_aplicable: p.itbis_aplicable,
import { traducirError } from "@/lib/errorTranslator";
      garantia_descripcion: p.garantia_descripcion || "",
import { traducirError } from "@/lib/errorTranslator";
      condiciones_garantia: p.condiciones_garantia || "",
import { traducirError } from "@/lib/errorTranslator";
      tipo: p.tipo || "producto",
import { traducirError } from "@/lib/errorTranslator";
      codigo_barras: p.codigo_barras || "",
import { traducirError } from "@/lib/errorTranslator";
      categoria_id: p.categoria_id || "",
import { traducirError } from "@/lib/errorTranslator";
    });
import { traducirError } from "@/lib/errorTranslator";
    setEditing(p.id);
import { traducirError } from "@/lib/errorTranslator";
    setOpen(true);
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleDelete = async (id: string) => {
import { traducirError } from "@/lib/errorTranslator";
    if (!confirm("¿Eliminar este producto?")) return;
import { traducirError } from "@/lib/errorTranslator";
    const { error } = await supabase.from("productos").delete().eq("id", id);
import { traducirError } from "@/lib/errorTranslator";
    if (error) { toast.error(error.message); return; }
import { traducirError } from "@/lib/errorTranslator";
    toast.success("Producto eliminado");
import { traducirError } from "@/lib/errorTranslator";
    await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
      user_id: user!.id,
import { traducirError } from "@/lib/errorTranslator";
      accion: "eliminar_producto",
import { traducirError } from "@/lib/errorTranslator";
      entidad: "productos",
import { traducirError } from "@/lib/errorTranslator";
      entidad_id: id,
import { traducirError } from "@/lib/errorTranslator";
      detalles: { producto_id: id }
import { traducirError } from "@/lib/errorTranslator";
    } as any);
import { traducirError } from "@/lib/errorTranslator";
    load();
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const filtered = productos.filter(p =>
import { traducirError } from "@/lib/errorTranslator";
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
import { traducirError } from "@/lib/errorTranslator";
    (p.codigo_barras || "").toLowerCase().includes(search.toLowerCase())
import { traducirError } from "@/lib/errorTranslator";
  );
import { traducirError } from "@/lib/errorTranslator";
  const isService = form.tipo === "servicio";
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  return (
import { traducirError } from "@/lib/errorTranslator";
    <div className="animate-fade-in space-y-6">
import { traducirError } from "@/lib/errorTranslator";
      <div className="flex items-center justify-between">
import { traducirError } from "@/lib/errorTranslator";
        <div>
import { traducirError } from "@/lib/errorTranslator";
          <h1 className="text-2xl font-bold text-foreground">Productos y Servicios</h1>
import { traducirError } from "@/lib/errorTranslator";
          <p className="text-muted-foreground">{productos.length} registrados</p>
import { traducirError } from "@/lib/errorTranslator";
        </div>
import { traducirError } from "@/lib/errorTranslator";
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(emptyForm); } }}>
import { traducirError } from "@/lib/errorTranslator";
          <DialogTrigger asChild>
import { traducirError } from "@/lib/errorTranslator";
            <Button><Plus className="mr-2 h-4 w-4" />Nuevo</Button>
import { traducirError } from "@/lib/errorTranslator";
          </DialogTrigger>
import { traducirError } from "@/lib/errorTranslator";
          <DialogContent className="max-w-lg">
import { traducirError } from "@/lib/errorTranslator";
            <DialogHeader>
import { traducirError } from "@/lib/errorTranslator";
              <DialogTitle>{editing ? "Editar" : "Nuevo"} {isService ? "Servicio" : "Producto"}</DialogTitle>
import { traducirError } from "@/lib/errorTranslator";
            </DialogHeader>
import { traducirError } from "@/lib/errorTranslator";
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
import { traducirError } from "@/lib/errorTranslator";
              {/* Tipo */}
import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                <Label>Tipo *</Label>
import { traducirError } from "@/lib/errorTranslator";
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
import { traducirError } from "@/lib/errorTranslator";
                  <SelectTrigger><SelectValue /></SelectTrigger>
import { traducirError } from "@/lib/errorTranslator";
                  <SelectContent>
import { traducirError } from "@/lib/errorTranslator";
                    <SelectItem value="producto">📦 Producto</SelectItem>
import { traducirError } from "@/lib/errorTranslator";
                    <SelectItem value="servicio">🔧 Servicio</SelectItem>
import { traducirError } from "@/lib/errorTranslator";
                  </SelectContent>
import { traducirError } from "@/lib/errorTranslator";
                </Select>
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
              {/* Categoría */}
import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                <Label>Categoría *</Label>
import { traducirError } from "@/lib/errorTranslator";
                <Select value={form.categoria_id} onValueChange={v => setForm(f => ({ ...f, categoria_id: v }))}>
import { traducirError } from "@/lib/errorTranslator";
                  <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
import { traducirError } from "@/lib/errorTranslator";
                  <SelectContent>
import { traducirError } from "@/lib/errorTranslator";
                    {categorias.map(c => (
import { traducirError } from "@/lib/errorTranslator";
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
import { traducirError } from "@/lib/errorTranslator";
                    ))}
import { traducirError } from "@/lib/errorTranslator";
                  </SelectContent>
import { traducirError } from "@/lib/errorTranslator";
                </Select>
import { traducirError } from "@/lib/errorTranslator";
                {categorias.length === 0 && (
import { traducirError } from "@/lib/errorTranslator";
                  <p className="text-xs text-destructive">No hay categorías. Cree una en el módulo de Categorías primero.</p>
import { traducirError } from "@/lib/errorTranslator";
                )}
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
              {/* Código de barras */}
import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                <Label className="flex items-center gap-1.5">
import { traducirError } from "@/lib/errorTranslator";
                  <Barcode className="h-4 w-4" /> Código de Barras
import { traducirError } from "@/lib/errorTranslator";
                </Label>
import { traducirError } from "@/lib/errorTranslator";
                <div className="flex gap-2">
import { traducirError } from "@/lib/errorTranslator";
                  <Input
import { traducirError } from "@/lib/errorTranslator";
                    value={form.codigo_barras}
import { traducirError } from "@/lib/errorTranslator";
                    onChange={e => setForm(f => ({ ...f, codigo_barras: e.target.value }))}
import { traducirError } from "@/lib/errorTranslator";
                    placeholder="Se genera automáticamente si se deja vacío"
import { traducirError } from "@/lib/errorTranslator";
                  />
import { traducirError } from "@/lib/errorTranslator";
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, codigo_barras: generateBarcode() }))}>
import { traducirError } from "@/lib/errorTranslator";
                    Generar
import { traducirError } from "@/lib/errorTranslator";
                  </Button>
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                <p className="text-xs text-muted-foreground">Escanee o escriba el código. Si está vacío se generará automáticamente.</p>
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                <Label>Nombre *</Label>
import { traducirError } from "@/lib/errorTranslator";
                <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                <Label>Descripción</Label>
import { traducirError } from "@/lib/errorTranslator";
                <Input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";
              <div className="grid grid-cols-2 gap-4">
import { traducirError } from "@/lib/errorTranslator";
                <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                  <Label>Precio (RD$)</Label>
import { traducirError } from "@/lib/errorTranslator";
                  <Input type="number" step="0.01" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                {!isService && (
import { traducirError } from "@/lib/errorTranslator";
                  <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                    <Label>Costo (RD$)</Label>
import { traducirError } from "@/lib/errorTranslator";
                    <Input type="number" step="0.01" value={form.costo} onChange={e => setForm(f => ({ ...f, costo: e.target.value }))} />
import { traducirError } from "@/lib/errorTranslator";
                  </div>
import { traducirError } from "@/lib/errorTranslator";
                )}
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";
              {!isService && (
import { traducirError } from "@/lib/errorTranslator";
                <div className="grid grid-cols-2 gap-4">
import { traducirError } from "@/lib/errorTranslator";
                  <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                    <Label>Stock</Label>
import { traducirError } from "@/lib/errorTranslator";
                    <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
import { traducirError } from "@/lib/errorTranslator";
                  </div>
import { traducirError } from "@/lib/errorTranslator";
                  <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                    <Label>Stock Mínimo</Label>
import { traducirError } from "@/lib/errorTranslator";
                    <Input type="number" value={form.stock_minimo} onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))} />
import { traducirError } from "@/lib/errorTranslator";
                  </div>
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
              )}
import { traducirError } from "@/lib/errorTranslator";
              <div className="flex items-center gap-2">
import { traducirError } from "@/lib/errorTranslator";
                <Switch checked={form.itbis_aplicable} onCheckedChange={v => setForm(f => ({ ...f, itbis_aplicable: v }))} />
import { traducirError } from "@/lib/errorTranslator";
                <Label>Aplica ITBIS (18%)</Label>
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
              {/* Garantía */}
import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/30">
import { traducirError } from "@/lib/errorTranslator";
                <div className="flex items-center gap-2 mb-1">
import { traducirError } from "@/lib/errorTranslator";
                  <ShieldCheck className="h-4 w-4 text-primary" />
import { traducirError } from "@/lib/errorTranslator";
                  <Label className="text-sm font-semibold">Garantía</Label>
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                  <Input
import { traducirError } from "@/lib/errorTranslator";
                    value={form.garantia_descripcion}
import { traducirError } from "@/lib/errorTranslator";
                    onChange={e => setForm(f => ({ ...f, garantia_descripcion: e.target.value }))}
import { traducirError } from "@/lib/errorTranslator";
                    placeholder="Ej: 12 meses contra defectos de fábrica"
import { traducirError } from "@/lib/errorTranslator";
                  />
import { traducirError } from "@/lib/errorTranslator";
                  <Textarea
import { traducirError } from "@/lib/errorTranslator";
                    value={form.condiciones_garantia}
import { traducirError } from "@/lib/errorTranslator";
                    onChange={e => setForm(f => ({ ...f, condiciones_garantia: e.target.value }))}
import { traducirError } from "@/lib/errorTranslator";
                    placeholder="Condiciones detalladas de la garantía (aparecerán en la factura)..."
import { traducirError } from "@/lib/errorTranslator";
                    rows={3}
import { traducirError } from "@/lib/errorTranslator";
                  />
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                <p className="text-xs text-muted-foreground">
import { traducirError } from "@/lib/errorTranslator";
                  Estos textos aparecerán en la factura PDF junto al {isService ? "servicio" : "producto"}.
import { traducirError } from "@/lib/errorTranslator";
                </p>
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
              <Button onClick={handleSave} className="w-full">{editing ? "Actualizar" : "Crear"}</Button>
import { traducirError } from "@/lib/errorTranslator";
            </div>
import { traducirError } from "@/lib/errorTranslator";
          </DialogContent>
import { traducirError } from "@/lib/errorTranslator";
        </Dialog>
import { traducirError } from "@/lib/errorTranslator";
      </div>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
      <div className="relative max-w-sm">
import { traducirError } from "@/lib/errorTranslator";
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
import { traducirError } from "@/lib/errorTranslator";
        <Input className="pl-9" placeholder="Buscar por nombre o código de barras..." value={search} onChange={e => setSearch(e.target.value)} />
import { traducirError } from "@/lib/errorTranslator";
      </div>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
      <Card>
import { traducirError } from "@/lib/errorTranslator";
        <CardContent className="p-0">
import { traducirError } from "@/lib/errorTranslator";
          <Table>
import { traducirError } from "@/lib/errorTranslator";
            <TableHeader>
import { traducirError } from "@/lib/errorTranslator";
              <TableRow>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>Código</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>Nombre</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>Categoría</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>Tipo</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>Precio</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>Stock</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>ITBIS</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>Garantía</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead className="w-28">Acciones</TableHead>
import { traducirError } from "@/lib/errorTranslator";
              </TableRow>
import { traducirError } from "@/lib/errorTranslator";
            </TableHeader>
import { traducirError } from "@/lib/errorTranslator";
            <TableBody>
import { traducirError } from "@/lib/errorTranslator";
              {filtered.length === 0 ? (
import { traducirError } from "@/lib/errorTranslator";
                <TableRow>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
import { traducirError } from "@/lib/errorTranslator";
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
import { traducirError } from "@/lib/errorTranslator";
                    No hay productos
import { traducirError } from "@/lib/errorTranslator";
                  </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                </TableRow>
import { traducirError } from "@/lib/errorTranslator";
              ) : filtered.map(p => (
import { traducirError } from "@/lib/errorTranslator";
                <TableRow key={p.id}>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{p.codigo_barras || "—"}</code>
import { traducirError } from "@/lib/errorTranslator";
                  </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell className="font-medium">
import { traducirError } from "@/lib/errorTranslator";
                    <div className="flex items-center gap-2">
import { traducirError } from "@/lib/errorTranslator";
                      {p.nombre}
import { traducirError } from "@/lib/errorTranslator";
                      {p.tipo !== "servicio" && p.stock <= p.stock_minimo && (
import { traducirError } from "@/lib/errorTranslator";
                        <AlertTriangle className="h-4 w-4 text-destructive" />
import { traducirError } from "@/lib/errorTranslator";
                      )}
import { traducirError } from "@/lib/errorTranslator";
                    </div>
import { traducirError } from "@/lib/errorTranslator";
                    {p.descripcion && <p className="text-xs text-muted-foreground">{p.descripcion}</p>}
import { traducirError } from "@/lib/errorTranslator";
                  </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                    <span className="text-xs text-muted-foreground">
import { traducirError } from "@/lib/errorTranslator";
                      {categorias.find(c => c.id === p.categoria_id)?.nombre || "—"}
import { traducirError } from "@/lib/errorTranslator";
                    </span>
import { traducirError } from "@/lib/errorTranslator";
                  </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                    {p.tipo === "servicio" ? (
import { traducirError } from "@/lib/errorTranslator";
                      <Badge variant="outline" className="gap-1"><Wrench className="h-3 w-3" />Servicio</Badge>
import { traducirError } from "@/lib/errorTranslator";
                    ) : (
import { traducirError } from "@/lib/errorTranslator";
                      <Badge variant="secondary">Producto</Badge>
import { traducirError } from "@/lib/errorTranslator";
                    )}
import { traducirError } from "@/lib/errorTranslator";
                  </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>RD$ {Number(p.precio).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                    {p.tipo === "servicio" ? (
import { traducirError } from "@/lib/errorTranslator";
                      <span className="text-xs text-muted-foreground">N/A</span>
import { traducirError } from "@/lib/errorTranslator";
                    ) : (
import { traducirError } from "@/lib/errorTranslator";
                      <Badge variant={p.stock <= p.stock_minimo ? "destructive" : "secondary"}>
import { traducirError } from "@/lib/errorTranslator";
                        {p.stock}
import { traducirError } from "@/lib/errorTranslator";
                      </Badge>
import { traducirError } from "@/lib/errorTranslator";
                    )}
import { traducirError } from "@/lib/errorTranslator";
                  </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>{p.itbis_aplicable ? "Sí" : "No"}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                    {p.garantia_descripcion ? (
import { traducirError } from "@/lib/errorTranslator";
                      <div className="flex items-center gap-1">
import { traducirError } from "@/lib/errorTranslator";
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
import { traducirError } from "@/lib/errorTranslator";
                        <span className="text-xs text-muted-foreground max-w-[120px] truncate">{p.garantia_descripcion}</span>
import { traducirError } from "@/lib/errorTranslator";
                      </div>
import { traducirError } from "@/lib/errorTranslator";
                    ) : (
import { traducirError } from "@/lib/errorTranslator";
                      <span className="text-xs text-muted-foreground">—</span>
import { traducirError } from "@/lib/errorTranslator";
                    )}
import { traducirError } from "@/lib/errorTranslator";
                  </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                    <div className="flex gap-1">
import { traducirError } from "@/lib/errorTranslator";
                      <Button variant="ghost" size="icon" title="Ver Kardex" onClick={() => setKardex({ id: p.id, nombre: p.nombre })}>
import { traducirError } from "@/lib/errorTranslator";
                        <ClipboardList className="h-4 w-4 text-primary" />
import { traducirError } from "@/lib/errorTranslator";
                      </Button>
import { traducirError } from "@/lib/errorTranslator";
                      {p.codigo_barras && (
import { traducirError } from "@/lib/errorTranslator";
                        <Button
import { traducirError } from "@/lib/errorTranslator";
                          variant="ghost"
import { traducirError } from "@/lib/errorTranslator";
                          size="icon"
import { traducirError } from "@/lib/errorTranslator";
                          title="Imprimir código de barras"
import { traducirError } from "@/lib/errorTranslator";
                          onClick={() => setBarcodePrint({ codigo: p.codigo_barras!, nombre: p.nombre, precio: p.precio })}
import { traducirError } from "@/lib/errorTranslator";
                        >
import { traducirError } from "@/lib/errorTranslator";
                          <Printer className="h-4 w-4" />
import { traducirError } from "@/lib/errorTranslator";
                        </Button>
import { traducirError } from "@/lib/errorTranslator";
                      )}
import { traducirError } from "@/lib/errorTranslator";
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
import { traducirError } from "@/lib/errorTranslator";
                        <Pencil className="h-4 w-4" />
import { traducirError } from "@/lib/errorTranslator";
                      </Button>
import { traducirError } from "@/lib/errorTranslator";
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
import { traducirError } from "@/lib/errorTranslator";
                        <Trash2 className="h-4 w-4 text-destructive" />
import { traducirError } from "@/lib/errorTranslator";
                      </Button>
import { traducirError } from "@/lib/errorTranslator";
                    </div>
import { traducirError } from "@/lib/errorTranslator";
                  </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                </TableRow>
import { traducirError } from "@/lib/errorTranslator";
              ))}
import { traducirError } from "@/lib/errorTranslator";
            </TableBody>
import { traducirError } from "@/lib/errorTranslator";
          </Table>
import { traducirError } from "@/lib/errorTranslator";
        </CardContent>
import { traducirError } from "@/lib/errorTranslator";
      </Card>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
      {barcodePrint && (
import { traducirError } from "@/lib/errorTranslator";
        <BarcodePrintModal
import { traducirError } from "@/lib/errorTranslator";
          open={!!barcodePrint}
import { traducirError } from "@/lib/errorTranslator";
          onOpenChange={(o) => { if (!o) setBarcodePrint(null); }}
import { traducirError } from "@/lib/errorTranslator";
          codigo={barcodePrint.codigo}
import { traducirError } from "@/lib/errorTranslator";
          nombre={barcodePrint.nombre}
import { traducirError } from "@/lib/errorTranslator";
          precio={barcodePrint.precio}
import { traducirError } from "@/lib/errorTranslator";
        />
import { traducirError } from "@/lib/errorTranslator";
      )}
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
      {kardex && (
import { traducirError } from "@/lib/errorTranslator";
        <KardexModal
import { traducirError } from "@/lib/errorTranslator";
          open={!!kardex}
import { traducirError } from "@/lib/errorTranslator";
          onOpenChange={(o) => { if (!o) setKardex(null); }}
import { traducirError } from "@/lib/errorTranslator";
          productoId={kardex.id}
import { traducirError } from "@/lib/errorTranslator";
          productoNombre={kardex.nombre}
import { traducirError } from "@/lib/errorTranslator";
        />
import { traducirError } from "@/lib/errorTranslator";
      )}
import { traducirError } from "@/lib/errorTranslator";
    </div>
import { traducirError } from "@/lib/errorTranslator";
  );
import { traducirError } from "@/lib/errorTranslator";
