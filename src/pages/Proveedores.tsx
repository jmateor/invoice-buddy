
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Truck } from "lucide-react";
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
interface Proveedor {
import { traducirError } from "@/lib/errorTranslator";
  id: string;
import { traducirError } from "@/lib/errorTranslator";
  nombre: string;
import { traducirError } from "@/lib/errorTranslator";
  rnc: string | null;
import { traducirError } from "@/lib/errorTranslator";
  direccion: string | null;
import { traducirError } from "@/lib/errorTranslator";
  telefono: string | null;
import { traducirError } from "@/lib/errorTranslator";
  email: string | null;
import { traducirError } from "@/lib/errorTranslator";
}
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
const emptyForm = { nombre: "", rnc: "", direccion: "", telefono: "", email: "" };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
export default function Proveedores() {
import { traducirError } from "@/lib/errorTranslator";
  const { user } = useAuth();
import { traducirError } from "@/lib/errorTranslator";
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
import { traducirError } from "@/lib/errorTranslator";
  const [search, setSearch] = useState("");
import { traducirError } from "@/lib/errorTranslator";
  const [open, setOpen] = useState(false);
import { traducirError } from "@/lib/errorTranslator";
  const [editing, setEditing] = useState<string | null>(null);
import { traducirError } from "@/lib/errorTranslator";
  const [form, setForm] = useState(emptyForm);
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const load = async () => {
import { traducirError } from "@/lib/errorTranslator";
    const { data } = await supabase.from("proveedores").select("*").order("nombre");
import { traducirError } from "@/lib/errorTranslator";
    setProveedores(data || []);
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
    const payload = { nombre: form.nombre, rnc: form.rnc || null, direccion: form.direccion || null, telefono: form.telefono || null, email: form.email || null };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
    if (editing) {
import { traducirError } from "@/lib/errorTranslator";
      const { error } = await supabase.from("proveedores").update(payload).eq("id", editing);
import { traducirError } from "@/lib/errorTranslator";
      if (error) { toast.error(error.message); return; }
import { traducirError } from "@/lib/errorTranslator";
      toast.success("Proveedor actualizado");
import { traducirError } from "@/lib/errorTranslator";
      await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
        user_id: user!.id,
import { traducirError } from "@/lib/errorTranslator";
        accion: "actualizar_proveedor",
import { traducirError } from "@/lib/errorTranslator";
        entidad: "proveedores",
import { traducirError } from "@/lib/errorTranslator";
        entidad_id: editing,
import { traducirError } from "@/lib/errorTranslator";
        detalles: { payload }
import { traducirError } from "@/lib/errorTranslator";
      } as any);
import { traducirError } from "@/lib/errorTranslator";
    } else {
import { traducirError } from "@/lib/errorTranslator";
      const { data, error } = await supabase.from("proveedores").insert({ ...payload, user_id: user!.id }).select("id").single();
import { traducirError } from "@/lib/errorTranslator";
      if (error) { toast.error(error.message); return; }
import { traducirError } from "@/lib/errorTranslator";
      toast.success("Proveedor creado");
import { traducirError } from "@/lib/errorTranslator";
      await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
        user_id: user!.id,
import { traducirError } from "@/lib/errorTranslator";
        accion: "crear_proveedor",
import { traducirError } from "@/lib/errorTranslator";
        entidad: "proveedores",
import { traducirError } from "@/lib/errorTranslator";
        entidad_id: data.id,
import { traducirError } from "@/lib/errorTranslator";
        detalles: { payload }
import { traducirError } from "@/lib/errorTranslator";
      } as any);
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";
    setOpen(false); setEditing(null); setForm(emptyForm); load();
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleEdit = (p: Proveedor) => {
import { traducirError } from "@/lib/errorTranslator";
    setForm({ nombre: p.nombre, rnc: p.rnc || "", direccion: p.direccion || "", telefono: p.telefono || "", email: p.email || "" });
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
    if (!confirm("¿Eliminar este proveedor?")) return;
import { traducirError } from "@/lib/errorTranslator";
    const { error } = await supabase.from("proveedores").delete().eq("id", id);
import { traducirError } from "@/lib/errorTranslator";
    if (error) { toast.error(error.message); return; }
import { traducirError } from "@/lib/errorTranslator";
    toast.success("Proveedor eliminado");
import { traducirError } from "@/lib/errorTranslator";
    await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
      user_id: user!.id,
import { traducirError } from "@/lib/errorTranslator";
      accion: "eliminar_proveedor",
import { traducirError } from "@/lib/errorTranslator";
      entidad: "proveedores",
import { traducirError } from "@/lib/errorTranslator";
      entidad_id: id,
import { traducirError } from "@/lib/errorTranslator";
      detalles: { proveedor_id: id }
import { traducirError } from "@/lib/errorTranslator";
    } as any);
import { traducirError } from "@/lib/errorTranslator";
    load();
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const filtered = proveedores.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()));
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
          <h1 className="text-2xl font-bold text-foreground">Proveedores</h1>
import { traducirError } from "@/lib/errorTranslator";
          <p className="text-muted-foreground">{proveedores.length} proveedores registrados</p>
import { traducirError } from "@/lib/errorTranslator";
        </div>
import { traducirError } from "@/lib/errorTranslator";
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(emptyForm); } }}>
import { traducirError } from "@/lib/errorTranslator";
          <DialogTrigger asChild>
import { traducirError } from "@/lib/errorTranslator";
            <Button><Plus className="mr-2 h-4 w-4" />Nuevo Proveedor</Button>
import { traducirError } from "@/lib/errorTranslator";
          </DialogTrigger>
import { traducirError } from "@/lib/errorTranslator";
          <DialogContent>
import { traducirError } from "@/lib/errorTranslator";
            <DialogHeader>
import { traducirError } from "@/lib/errorTranslator";
              <DialogTitle>{editing ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
import { traducirError } from "@/lib/errorTranslator";
            </DialogHeader>
import { traducirError } from "@/lib/errorTranslator";
            <div className="space-y-4">
import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-2"><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} /></div>
import { traducirError } from "@/lib/errorTranslator";
              <div className="grid grid-cols-2 gap-4">
import { traducirError } from "@/lib/errorTranslator";
                <div className="space-y-2"><Label>RNC</Label><Input value={form.rnc} onChange={e => setForm(f => ({ ...f, rnc: e.target.value }))} /></div>
import { traducirError } from "@/lib/errorTranslator";
                <div className="space-y-2"><Label>Teléfono</Label><Input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} /></div>
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-2"><Label>Dirección</Label><Input value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} /></div>
import { traducirError } from "@/lib/errorTranslator";
              <Button onClick={handleSave} className="w-full">{editing ? "Actualizar" : "Crear"} Proveedor</Button>
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
        <Input className="pl-9" placeholder="Buscar proveedor..." value={search} onChange={e => setSearch(e.target.value)} />
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
                <TableHead>Nombre</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>RNC</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>Teléfono</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>Email</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead className="w-24">Acciones</TableHead>
import { traducirError } from "@/lib/errorTranslator";
              </TableRow>
import { traducirError } from "@/lib/errorTranslator";
            </TableHeader>
import { traducirError } from "@/lib/errorTranslator";
            <TableBody>
import { traducirError } from "@/lib/errorTranslator";
              {filtered.length === 0 ? (
import { traducirError } from "@/lib/errorTranslator";
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground"><Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />No hay proveedores</TableCell></TableRow>
import { traducirError } from "@/lib/errorTranslator";
              ) : filtered.map(p => (
import { traducirError } from "@/lib/errorTranslator";
                <TableRow key={p.id}>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell className="font-medium">{p.nombre}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>{p.rnc || "—"}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>{p.telefono || "—"}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>{p.email || "—"}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                    <div className="flex gap-1">
import { traducirError } from "@/lib/errorTranslator";
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Pencil className="h-4 w-4" /></Button>
import { traducirError } from "@/lib/errorTranslator";
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
    </div>
import { traducirError } from "@/lib/errorTranslator";
  );
import { traducirError } from "@/lib/errorTranslator";
