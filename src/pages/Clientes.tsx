
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Users, Mail, MessageCircle, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
interface Cliente {
import { traducirError } from "@/lib/errorTranslator";
  id: string;
import { traducirError } from "@/lib/errorTranslator";
  nombre: string;
import { traducirError } from "@/lib/errorTranslator";
  rnc_cedula: string | null;
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
const emptyCliente = { nombre: "", rnc_cedula: "", direccion: "", telefono: "", email: "" };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
export default function Clientes() {
import { traducirError } from "@/lib/errorTranslator";
  const { user } = useAuth();
import { traducirError } from "@/lib/errorTranslator";
  const [clientes, setClientes] = useState<Cliente[]>([]);
import { traducirError } from "@/lib/errorTranslator";
  const [search, setSearch] = useState("");
import { traducirError } from "@/lib/errorTranslator";
  const [open, setOpen] = useState(false);
import { traducirError } from "@/lib/errorTranslator";
  const [editing, setEditing] = useState<string | null>(null);
import { traducirError } from "@/lib/errorTranslator";
  const [form, setForm] = useState(emptyCliente);
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const load = async () => {
import { traducirError } from "@/lib/errorTranslator";
    const { data } = await supabase.from("clientes").select("*").order("nombre");
import { traducirError } from "@/lib/errorTranslator";
    setClientes(data || []);
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

import { traducirError } from "@/lib/errorTranslator";
    if (editing) {
import { traducirError } from "@/lib/errorTranslator";
      const { error } = await supabase.from("clientes").update(form).eq("id", editing);
import { traducirError } from "@/lib/errorTranslator";
      if (error) { toast.error(traducirError(error.message)); return; }
import { traducirError } from "@/lib/errorTranslator";
      toast.success("Cliente actualizado");
import { traducirError } from "@/lib/errorTranslator";
      await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
        user_id: user!.id,
import { traducirError } from "@/lib/errorTranslator";
        accion: "actualizar_cliente",
import { traducirError } from "@/lib/errorTranslator";
        entidad: "clientes",
import { traducirError } from "@/lib/errorTranslator";
        entidad_id: editing,
import { traducirError } from "@/lib/errorTranslator";
        detalles: { form }
import { traducirError } from "@/lib/errorTranslator";
      } as any);
import { traducirError } from "@/lib/errorTranslator";
    } else {
import { traducirError } from "@/lib/errorTranslator";
      const { data, error } = await supabase.from("clientes").insert({ ...form, user_id: user!.id }).select("id").single();
import { traducirError } from "@/lib/errorTranslator";
      if (error) { toast.error(traducirError(error.message)); return; }
import { traducirError } from "@/lib/errorTranslator";
      toast.success("Cliente creado");
import { traducirError } from "@/lib/errorTranslator";
      await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
        user_id: user!.id,
import { traducirError } from "@/lib/errorTranslator";
        accion: "crear_cliente",
import { traducirError } from "@/lib/errorTranslator";
        entidad: "clientes",
import { traducirError } from "@/lib/errorTranslator";
        entidad_id: data.id,
import { traducirError } from "@/lib/errorTranslator";
        detalles: { form }
import { traducirError } from "@/lib/errorTranslator";
      } as any);
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";
    setOpen(false);
import { traducirError } from "@/lib/errorTranslator";
    setEditing(null);
import { traducirError } from "@/lib/errorTranslator";
    setForm(emptyCliente);
import { traducirError } from "@/lib/errorTranslator";
    load();
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleEdit = (c: Cliente) => {
import { traducirError } from "@/lib/errorTranslator";
    setForm({ nombre: c.nombre, rnc_cedula: c.rnc_cedula || "", direccion: c.direccion || "", telefono: c.telefono || "", email: c.email || "" });
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
    if (!confirm("¿Eliminar este cliente?")) return;
import { traducirError } from "@/lib/errorTranslator";
    const { error } = await supabase.from("clientes").delete().eq("id", id);
import { traducirError } from "@/lib/errorTranslator";
    if (error) { toast.error(traducirError(error.message)); return; }
import { traducirError } from "@/lib/errorTranslator";
    toast.success("Cliente eliminado");
import { traducirError } from "@/lib/errorTranslator";
    await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
      user_id: user!.id,
import { traducirError } from "@/lib/errorTranslator";
      accion: "eliminar_cliente",
import { traducirError } from "@/lib/errorTranslator";
      entidad: "clientes",
import { traducirError } from "@/lib/errorTranslator";
      entidad_id: id,
import { traducirError } from "@/lib/errorTranslator";
      detalles: { cliente_id: id }
import { traducirError } from "@/lib/errorTranslator";
    } as any);
import { traducirError } from "@/lib/errorTranslator";
    load();
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleExportExcel = () => {
import { traducirError } from "@/lib/errorTranslator";
    const dataToExport = clientes.map(c => ({
import { traducirError } from "@/lib/errorTranslator";
      Nombre: c.nombre,
import { traducirError } from "@/lib/errorTranslator";
      "RNC/Cédula": c.rnc_cedula || "",
import { traducirError } from "@/lib/errorTranslator";
      Teléfono: c.telefono || "",
import { traducirError } from "@/lib/errorTranslator";
      Email: c.email || "",
import { traducirError } from "@/lib/errorTranslator";
      Dirección: c.direccion || ""
import { traducirError } from "@/lib/errorTranslator";
    }));
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
import { traducirError } from "@/lib/errorTranslator";
    const workbook = XLSX.utils.book_new();
import { traducirError } from "@/lib/errorTranslator";
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
import { traducirError } from "@/lib/errorTranslator";
    XLSX.writeFile(workbook, "clientes.xlsx");
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const filtered = clientes.filter(c =>
import { traducirError } from "@/lib/errorTranslator";
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
import { traducirError } from "@/lib/errorTranslator";
    (c.rnc_cedula || "").includes(search)
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
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
import { traducirError } from "@/lib/errorTranslator";
          <p className="text-muted-foreground">{clientes.length} clientes registrados</p>
import { traducirError } from "@/lib/errorTranslator";
        </div>
import { traducirError } from "@/lib/errorTranslator";
        <div className="flex gap-2">
import { traducirError } from "@/lib/errorTranslator";
          <Button variant="outline" onClick={handleExportExcel}>
import { traducirError } from "@/lib/errorTranslator";
            <Download className="mr-2 h-4 w-4" />
import { traducirError } from "@/lib/errorTranslator";
            Exportar Excel
import { traducirError } from "@/lib/errorTranslator";
          </Button>
import { traducirError } from "@/lib/errorTranslator";
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(emptyCliente); } }}>
import { traducirError } from "@/lib/errorTranslator";
            <DialogTrigger asChild>
import { traducirError } from "@/lib/errorTranslator";
              <Button><Plus className="mr-2 h-4 w-4" />Nuevo Cliente</Button>
import { traducirError } from "@/lib/errorTranslator";
            </DialogTrigger>
import { traducirError } from "@/lib/errorTranslator";
            <DialogContent>
import { traducirError } from "@/lib/errorTranslator";
              <DialogHeader>
import { traducirError } from "@/lib/errorTranslator";
                <DialogTitle>{editing ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
import { traducirError } from "@/lib/errorTranslator";
              </DialogHeader>
import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-4">
import { traducirError } from "@/lib/errorTranslator";
                <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                  <Label>Nombre *</Label>
import { traducirError } from "@/lib/errorTranslator";
                  <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                <div className="grid grid-cols-2 gap-4">
import { traducirError } from "@/lib/errorTranslator";
                  <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                    <Label>RNC / Cédula</Label>
import { traducirError } from "@/lib/errorTranslator";
                    <Input value={form.rnc_cedula} onChange={e => setForm(f => ({ ...f, rnc_cedula: e.target.value }))} />
import { traducirError } from "@/lib/errorTranslator";
                  </div>
import { traducirError } from "@/lib/errorTranslator";
                  <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                    <Label>Teléfono</Label>
import { traducirError } from "@/lib/errorTranslator";
                    <Input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
import { traducirError } from "@/lib/errorTranslator";
                  </div>
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                  <Label>Email</Label>
import { traducirError } from "@/lib/errorTranslator";
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                  <Label>Dirección</Label>
import { traducirError } from "@/lib/errorTranslator";
                  <Input value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                <Button onClick={handleSave} className="w-full">{editing ? "Actualizar" : "Crear"} Cliente</Button>
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";
            </DialogContent>
import { traducirError } from "@/lib/errorTranslator";
          </Dialog>
import { traducirError } from "@/lib/errorTranslator";
        </div>
import { traducirError } from "@/lib/errorTranslator";
      </div>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
      <div className="relative max-w-sm">
import { traducirError } from "@/lib/errorTranslator";
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
import { traducirError } from "@/lib/errorTranslator";
        <Input className="pl-9" placeholder="Buscar por nombre o RNC..." value={search} onChange={e => setSearch(e.target.value)} />
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
                <TableHead>RNC/Cédula</TableHead>
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
                <TableRow>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
import { traducirError } from "@/lib/errorTranslator";
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
import { traducirError } from "@/lib/errorTranslator";
                    No hay clientes
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
                  <TableCell>{c.rnc_cedula || "—"}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>{c.telefono || "—"}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>{c.email || "—"}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                    <div className="flex gap-1">
import { traducirError } from "@/lib/errorTranslator";
                      {c.telefono && (
import { traducirError } from "@/lib/errorTranslator";
                        <Button variant="ghost" size="icon" onClick={() => window.open(`https://wa.me/${c.telefono!.replace(/\\D/g, '')}`, '_blank')} title="Enviar WhatsApp">
import { traducirError } from "@/lib/errorTranslator";
                          <MessageCircle className="h-4 w-4 text-green-600" />
import { traducirError } from "@/lib/errorTranslator";
                        </Button>
import { traducirError } from "@/lib/errorTranslator";
                      )}
import { traducirError } from "@/lib/errorTranslator";
                      {c.email && (
import { traducirError } from "@/lib/errorTranslator";
                        <Button variant="ghost" size="icon" onClick={() => window.open(`mailto:${c.email}`, '_blank')} title="Enviar Correo">
import { traducirError } from "@/lib/errorTranslator";
                          <Mail className="h-4 w-4 text-blue-600" />
import { traducirError } from "@/lib/errorTranslator";
                        </Button>
import { traducirError } from "@/lib/errorTranslator";
                      )}
import { traducirError } from "@/lib/errorTranslator";
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} title="Editar">
import { traducirError } from "@/lib/errorTranslator";
                        <Pencil className="h-4 w-4" />
import { traducirError } from "@/lib/errorTranslator";
                      </Button>
import { traducirError } from "@/lib/errorTranslator";
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} title="Eliminar">
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
