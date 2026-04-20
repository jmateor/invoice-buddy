import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, HelpCircle } from "lucide-react";
import { TIPOS_COMPROBANTE_FISCAL } from "@/lib/dgii/catalogos";
import { traducirError } from "@/lib/errorTranslator";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  secuenciaId?: string | null;
  onSaved: () => void;
}

interface FormState {
  tipo_comprobante: string;
  nombre: string;
  numeracion_automatica: boolean;
  preferida: boolean;
  secuencia_actual: number;
  secuencia_limite: number;
  fecha_vencimiento: string;
  sucursal: string;
  pie_factura: string;
  activo: boolean;
}

const EMPTY: FormState = {
  tipo_comprobante: "B01",
  nombre: "",
  numeracion_automatica: true,
  preferida: false,
  secuencia_actual: 1,
  secuencia_limite: 999999,
  fecha_vencimiento: "",
  sucursal: "Principal",
  pie_factura: "",
  activo: true,
};

export default function EditNumeracionModal({ open, onOpenChange, secuenciaId, onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEdit = !!secuenciaId;

  useEffect(() => {
    if (!open) return;
    if (secuenciaId) {
      setLoading(true);
      supabase.from("ncf_secuencias").select("*").eq("id", secuenciaId).maybeSingle().then(({ data }) => {
        if (data) {
          const d = data as any;
          setForm({
            tipo_comprobante: d.tipo_comprobante,
            nombre: d.nombre || `${d.tipo_comprobante} - ${TIPOS_COMPROBANTE_FISCAL.find(t => t.codigo === d.tipo_comprobante)?.nombre || ""}`,
            numeracion_automatica: d.numeracion_automatica ?? true,
            preferida: d.preferida ?? false,
            secuencia_actual: d.secuencia_actual,
            secuencia_limite: d.secuencia_limite,
            fecha_vencimiento: d.fecha_vencimiento || "",
            sucursal: d.sucursal || "Principal",
            pie_factura: d.pie_factura || "",
            activo: d.activo,
          });
        }
        setLoading(false);
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, secuenciaId]);

  // Auto-suggest name based on tipo
  useEffect(() => {
    if (!isEdit && form.tipo_comprobante) {
      const t = TIPOS_COMPROBANTE_FISCAL.find(x => x.codigo === form.tipo_comprobante);
      if (t && !form.nombre) {
        setForm(f => ({ ...f, nombre: `${t.nombre} (${t.codigo})` }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.tipo_comprobante]);

  const handleSave = async () => {
    if (!user) return;
    if (!form.tipo_comprobante) { toast.error("Selecciona el tipo de comprobante"); return; }
    if (!form.nombre.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (form.secuencia_limite < form.secuencia_actual) {
      toast.error("El número final debe ser mayor o igual al actual");
      return;
    }
    setSaving(true);
    try {
      // If marked preferida, unmark others of same tipo
      if (form.preferida) {
        await supabase.from("ncf_secuencias")
          .update({ preferida: false } as any)
          .eq("user_id", user.id)
          .eq("tipo_comprobante", form.tipo_comprobante);
      }

      const payload = {
        user_id: user.id,
        tipo_comprobante: form.tipo_comprobante,
        nombre: form.nombre.trim(),
        numeracion_automatica: form.numeracion_automatica,
        preferida: form.preferida,
        secuencia_actual: form.secuencia_actual,
        secuencia_limite: form.secuencia_limite,
        fecha_vencimiento: form.fecha_vencimiento || null,
        sucursal: form.sucursal.trim() || "Principal",
        pie_factura: form.pie_factura.trim() || null,
        activo: form.activo,
        prefijo: form.tipo_comprobante,
        serie: form.tipo_comprobante.charAt(0),
      };

      if (isEdit) {
        const { error } = await supabase.from("ncf_secuencias").update(payload as any).eq("id", secuenciaId!);
        if (error) throw error;
        toast.success("Numeración actualizada");
      } else {
        const { error } = await supabase.from("ncf_secuencias").insert(payload as any);
        if (error) throw error;
        toast.success("Numeración creada");
      }
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(traducirError(err.message || "Error al guardar"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar numeración" : "Nueva numeración"}</DialogTitle>
          <DialogDescription>
            Configura los datos asociados a tu numeración de comprobantes fiscales (NCF/e-CF).
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Card className="border-border">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Configuración general</CardTitle>
                <CardDescription>Agrega los datos principales de tu numeración</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="preferida" className="text-sm">Preferida</Label>
                <Switch id="preferida" checked={form.preferida} onCheckedChange={v => setForm(f => ({ ...f, preferida: v }))} />
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de documento *</Label>
                <Input value="Factura de venta" disabled className="bg-muted" />
              </div>
              <div>
                <Label>Tipo de comprobante *</Label>
                <Select value={form.tipo_comprobante} onValueChange={v => setForm(f => ({ ...f, tipo_comprobante: v }))} disabled={isEdit}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_COMPROBANTE_FISCAL.map(t => (
                      <SelectItem key={t.codigo} value={t.codigo}>
                        {t.codigo} - {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {TIPOS_COMPROBANTE_FISCAL.find(t => t.codigo === form.tipo_comprobante)?.descripcion}
                </p>
              </div>

              <div className="flex items-center gap-2 md:col-span-1 mt-2">
                <Checkbox
                  id="auto"
                  checked={form.numeracion_automatica}
                  onCheckedChange={v => setForm(f => ({ ...f, numeracion_automatica: !!v }))}
                />
                <Label htmlFor="auto" className="cursor-pointer">Numeración automática</Label>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <Label>Número inicial *</Label>
                <Input
                  type="number" min={1}
                  value={form.secuencia_actual}
                  onChange={e => setForm(f => ({ ...f, secuencia_actual: parseInt(e.target.value) || 1 }))}
                />
              </div>

              <div>
                <Label>Nombre *</Label>
                <Input
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Crédito fiscal (B01)"
                />
              </div>
              <div>
                <Label>Número final</Label>
                <Input
                  type="number" min={form.secuencia_actual}
                  value={form.secuencia_limite}
                  onChange={e => setForm(f => ({ ...f, secuencia_limite: parseInt(e.target.value) || 0 }))}
                  placeholder="999999"
                />
                <p className="text-xs text-muted-foreground mt-1">Límite autorizado por DGII</p>
              </div>

              <div>
                <Label>Fecha de vencimiento *</Label>
                <Input
                  type="date"
                  value={form.fecha_vencimiento}
                  onChange={e => setForm(f => ({ ...f, fecha_vencimiento: e.target.value }))}
                />
              </div>
              <div>
                <Label>Sucursal *</Label>
                <Input value={form.sucursal} onChange={e => setForm(f => ({ ...f, sucursal: e.target.value }))} placeholder="Principal" />
              </div>

              <div className="md:col-span-2">
                <Label>Pie de factura</Label>
                <Textarea
                  rows={3}
                  value={form.pie_factura}
                  onChange={e => setForm(f => ({ ...f, pie_factura: e.target.value }))}
                  placeholder="Mensaje que se imprimirá al pie de las facturas con esta numeración"
                />
              </div>

              <div className="flex items-center gap-2 md:col-span-2">
                <Switch checked={form.activo} onCheckedChange={v => setForm(f => ({ ...f, activo: v }))} />
                <Label>Activa</Label>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Guardar cambios" : "Crear numeración"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}