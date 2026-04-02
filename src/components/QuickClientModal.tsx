
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
interface Props {
import { traducirError } from "@/lib/errorTranslator";
  open: boolean;
import { traducirError } from "@/lib/errorTranslator";
  onOpenChange: (open: boolean) => void;
import { traducirError } from "@/lib/errorTranslator";
  onCreated: (cliente: { id: string; nombre: string; rnc_cedula: string | null }) => void;
import { traducirError } from "@/lib/errorTranslator";
}
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
export default function QuickClientModal({ open, onOpenChange, onCreated }: Props) {
import { traducirError } from "@/lib/errorTranslator";
  const { user } = useAuth();
import { traducirError } from "@/lib/errorTranslator";
  const [saving, setSaving] = useState(false);
import { traducirError } from "@/lib/errorTranslator";
  const [form, setForm] = useState({ nombre: "", rnc_cedula: "", telefono: "", email: "", direccion: "" });
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleSave = async () => {
import { traducirError } from "@/lib/errorTranslator";
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
import { traducirError } from "@/lib/errorTranslator";
    setSaving(true);
import { traducirError } from "@/lib/errorTranslator";
    const { data, error } = await supabase
import { traducirError } from "@/lib/errorTranslator";
      .from("clientes")
import { traducirError } from "@/lib/errorTranslator";
      .insert({ ...form, user_id: user!.id })
import { traducirError } from "@/lib/errorTranslator";
      .select("id, nombre, rnc_cedula")
import { traducirError } from "@/lib/errorTranslator";
      .single();
import { traducirError } from "@/lib/errorTranslator";
    setSaving(false);
import { traducirError } from "@/lib/errorTranslator";
    if (error) { toast.error(traducirError(error.message)); return; }
import { traducirError } from "@/lib/errorTranslator";
    toast.success("Cliente creado");
import { traducirError } from "@/lib/errorTranslator";
    onCreated(data);
import { traducirError } from "@/lib/errorTranslator";
    setForm({ nombre: "", rnc_cedula: "", telefono: "", email: "", direccion: "" });
import { traducirError } from "@/lib/errorTranslator";
    onOpenChange(false);
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  return (
import { traducirError } from "@/lib/errorTranslator";
    <Dialog open={open} onOpenChange={onOpenChange}>
import { traducirError } from "@/lib/errorTranslator";
      <DialogContent>
import { traducirError } from "@/lib/errorTranslator";
        <DialogHeader><DialogTitle>Crear Cliente Rápido</DialogTitle></DialogHeader>
import { traducirError } from "@/lib/errorTranslator";
        <div className="space-y-4">
import { traducirError } from "@/lib/errorTranslator";
          <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
            <Label>Nombre *</Label>
import { traducirError } from "@/lib/errorTranslator";
            <Input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} autoFocus />
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
          <Button onClick={handleSave} className="w-full" disabled={saving}>
import { traducirError } from "@/lib/errorTranslator";
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
import { traducirError } from "@/lib/errorTranslator";
            Crear y Seleccionar
import { traducirError } from "@/lib/errorTranslator";
          </Button>
import { traducirError } from "@/lib/errorTranslator";
        </div>
import { traducirError } from "@/lib/errorTranslator";
      </DialogContent>
import { traducirError } from "@/lib/errorTranslator";
    </Dialog>
import { traducirError } from "@/lib/errorTranslator";
  );
import { traducirError } from "@/lib/errorTranslator";
