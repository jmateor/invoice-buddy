
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
import { Plus, Pencil, Trash2, Search, Tags } from "lucide-react";
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
interface Categoria {
import { traducirError } from "@/lib/errorTranslator";
  id: string;
import { traducirError } from "@/lib/errorTranslator";
  nombre: string;
import { traducirError } from "@/lib/errorTranslator";
  descripcion: string | null;
import { traducirError } from "@/lib/errorTranslator";
}
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
export default function Categorias() {
import { traducirError } from "@/lib/errorTranslator";
  const { user } = useAuth();
import { traducirError } from "@/lib/errorTranslator";
  const [categorias, setCategorias] = useState<Categoria[]>([]);
import { traducirError } from "@/lib/errorTranslator";
  const [search, setSearch] = useState("");
import { traducirError } from "@/lib/errorTranslator";
  const [open, setOpen] = useState(false);
import { traducirError } from "@/lib/errorTranslator";
  const [editing, setEditing] = useState<string | null>(null);
import { traducirError } from "@/lib/errorTranslator";
  const [nombre, setNombre] = useState("");
import { traducirError } from "@/lib/errorTranslator";
  const [descripcion, setDescripcion] = useState("");
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const load = async () => {
import { traducirError } from "@/lib/errorTranslator";
    const { data } = await supabase.from("categorias").select("*").order("nombre");
import { traducirError } from "@/lib/errorTranslator";
    setCategorias((data as any) || []);
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  useEffect(() => { if (user) load(); }, [user]);
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const resetForm = () => { setNombre(""); setDescripcion(""); setEditing(null); };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleSave = async () => {
import { traducirError } from "@/lib/errorTranslator";
    if (!nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
    if (editing) {
import { traducirError } from "@/lib/errorTranslator";
      const { error } = await supabase.from("categorias").update({ nombre, descripcion: descripcion || null } as any).eq("id", editing);
import { traducirError } from "@/lib/errorTranslator";
      if (error) { toast.error(traducirError(error.message)); return; }
import { traducirError } from "@/lib/errorTranslator";
      toast.success("Categoría actualizada");
import { traducirError } from "@/lib/errorTranslator";
      await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
        user_id: user!.id,
import { traducirError } from "@/lib/errorTranslator";
        accion: "actualizar_categoria",
import { traducirError } from "@/lib/errorTranslator";
        entidad: "categorias",
import { traducirError } from "@/lib/errorTranslator";
        entidad_id: editing,
import { traducirError } from "@/lib/errorTranslator";
        detalles: { nombre, descripcion }
import { traducirError } from "@/lib/errorTranslator";
      } as any);
import { traducirError } from "@/lib/errorTranslator";
    } else {
import { traducirError } from "@/lib/errorTranslator";
      const { data, error } = await supabase.from("categorias").insert({ nombre, descripcion: descripcion || null, user_id: user!.id } as any).select("id").single();
import { traducirError } from "@/lib/errorTranslator";
      if (error) { toast.error(traducirError(error.message)); return; }
import { traducirError } from "@/lib/errorTranslator";
      toast.success("Categoría creada");
import { traducirError } from "@/lib/errorTranslator";
      await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
        user_id: user!.id,
import { traducirError } from "@/lib/errorTranslator";
        accion: "crear_categoria",
import { traducirError } from "@/lib/errorTranslator";
        entidad: "categorias",
import { traducirError } from "@/lib/errorTranslator";
        entidad_id: data.id,
import { traducirError } from "@/lib/errorTranslator";
        detalles: { nombre, descripcion }
import { traducirError } from "@/lib/errorTranslator";
      } as any);
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";
    setOpen(false); resetForm(); load();
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleEdit = (c: Categoria) => {
import { traducirError } from "@/lib/errorTranslator";
    setNombre(c.nombre);
import { traducirError } from "@/lib/errorTranslator";
    setDescripcion(c.descripcion || "");
import { traducirError } from "@/lib/errorTranslator";
    setEditing(c.id);
import { traducirError } from "@/lib/errorTranslator";
    setOpen(true);
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleDelete = async (id: string) => {
import { traducirError } from "@/lib/errorTranslator";
    if (!confirm("¿Eliminar esta categoría? Los productos asociados quedarán sin categoría.")) return;
import { traducirError } from "@/lib/errorTranslator";
    const { error } = await supabase.from("categorias").delete().eq("id", id);
import { traducirError } from "@/lib/errorTranslator";
    if (error) { toast.error(traducirError(error.message)); return; }
import { traducirError } from "@/lib/errorTranslator";
    toast.success("Categoría eliminada");
import { traducirError } from "@/lib/errorTranslator";
    await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
      user_id: user!.id,
import { traducirError } from "@/lib/errorTranslator";
      accion: "eliminar_categoria",
import { traducirError } from "@/lib/errorTranslator";
      entidad: "categorias",
import { traducirError } from "@/lib/errorTranslator";
      entidad_id: id,
import { traducirError } from "@/lib/errorTranslator";
      detalles: { categoria_id: id }
import { traducirError } from "@/lib/errorTranslator";
    } as any);
import { traducirError } from "@/lib/errorTranslator";
    load();
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const filtered = categorias.filter(c =>
import { traducirError } from "@/lib/errorTranslator";
    c.nombre.toLowerCase().includes(search.toLowerCase())
import { traducirError } from "@/lib/errorTranslator";
  );
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
          <h1 className="text-2xl font-bold text-foreground">Categorías</h1>
import { traducirError } from "@/lib/errorTranslator";
          <p className="text-muted-foreground">{categorias.length} registradas</p>
import { traducirError } from "@/lib/errorTranslator";
        </div>
import { traducirError } from "@/lib/errorTranslator";
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
import { traducirError } from "@/lib/errorTranslator";
          <DialogTrigger asChild>
import { traducirError } from "@/lib/errorTranslator";
            <Button><Plus className="mr-2 h-4 w-4" />Nueva Categoría</Button>
import { traducirError } from "@/lib/errorTranslator";
          </DialogTrigger>
import { traducirError } from "@/lib/errorTranslator";
          <DialogContent className="max-w-md">
import { traducirError } from "@/lib/errorTranslator";
            <DialogHeader>
import { traducirError } from "@/lib/errorTranslator";
              <DialogTitle>{editing ? "Editar" : "Nueva"} Categoría</DialogTitle>
import { traducirError } from "@/lib/errorTranslator";
            </DialogHeader>
import { traducirError } from "@/lib/errorTranslator";
            <div className="space-y-4">
import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                <Label>Nombre *</Label>
import { traducirError } from "@/lib/errorTranslator";
                <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Electrónica, Accesorios..." />
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                <Label>Descripción</Label>
import { traducirError } from "@/lib/errorTranslator";
                <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción opcional" />
import { traducirError } from "@/lib/errorTranslator";
              </div>
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
        <Input className="pl-9" placeholder="Buscar categoría..." value={search} onChange={e => setSearch(e.target.value)} />
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
                <TableHead>Descripción</TableHead>
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
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
import { traducirError } from "@/lib/errorTranslator";
                    <Tags className="h-8 w-8 mx-auto mb-2 opacity-50" />
import { traducirError } from "@/lib/errorTranslator";
                    No hay categorías
import { traducirError } from "@/lib/errorTranslator";
                  </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                </TableRow>
import { traducirError } from "@/lib/errorTranslator";
              ) : filtered.map(c => (
import { traducirError } from "@/lib/errorTranslator";
                <TableRow key={c.id}>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell className="font-medium">{c.nombre}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell className="text-muted-foreground">{c.descripcion || "—"}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                    <div className="flex gap-1">
import { traducirError } from "@/lib/errorTranslator";
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
import { traducirError } from "@/lib/errorTranslator";
                        <Pencil className="h-4 w-4" />
import { traducirError } from "@/lib/errorTranslator";
                      </Button>
import { traducirError } from "@/lib/errorTranslator";
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
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
    </div>
import { traducirError } from "@/lib/errorTranslator";
  );
import { traducirError } from "@/lib/errorTranslator";
