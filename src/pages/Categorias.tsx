
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

interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export default function Categorias() {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const load = async () => {
    const { data } = await supabase.from("categorias").select("*").order("nombre");
    setCategorias((data as any) || []);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const resetForm = () => { setNombre(""); setDescripcion(""); setEditing(null); };

  const handleSave = async () => {
    if (!nombre.trim()) { toast.error("El nombre es obligatorio"); return; }

    if (editing) {
      const { error } = await supabase.from("categorias").update({ nombre, descripcion: descripcion || null } as any).eq("id", editing);
      if (error) { toast.error(traducirError(error.message)); return; }
      toast.success("Categoría actualizada");
      await supabase.from("audit_logs").insert({
        user_id: user!.id,
        accion: "actualizar_categoria",
        entidad: "categorias",
        entidad_id: editing,
        detalles: { nombre, descripcion }
      } as any);
    } else {
      const { data, error } = await supabase.from("categorias").insert({ nombre, descripcion: descripcion || null, user_id: user!.id } as any).select("id").single();
      if (error) { toast.error(traducirError(error.message)); return; }
      toast.success("Categoría creada");
      await supabase.from("audit_logs").insert({
        user_id: user!.id,
        accion: "crear_categoria",
        entidad: "categorias",
        entidad_id: data.id,
        detalles: { nombre, descripcion }
      } as any);
    }
    setOpen(false); resetForm(); load();
  };

  const handleEdit = (c: Categoria) => {
    setNombre(c.nombre);
    setDescripcion(c.descripcion || "");
    setEditing(c.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría? Los productos asociados quedarán sin categoría.")) return;
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) { toast.error(traducirError(error.message)); return; }
    toast.success("Categoría eliminada");
    await supabase.from("audit_logs").insert({
      user_id: user!.id,
      accion: "eliminar_categoria",
      entidad: "categorias",
      entidad_id: id,
      detalles: { categoria_id: id }
    } as any);
    load();
  };

  const filtered = categorias.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorías</h1>
          <p className="text-muted-foreground">{categorias.length} registradas</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nueva Categoría</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar" : "Nueva"} Categoría</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Electrónica, Accesorios..." />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción opcional" />
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? "Actualizar" : "Crear"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar categoría..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-28">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    <Tags className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No hay categorías
                  </TableCell>
                </TableRow>
              ) : filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{c.descripcion || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
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
    </div>
  );

}
