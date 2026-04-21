import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, ChevronRight, ChevronLeft, ShieldCheck, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { AMBIENTES_DGII, PROVINCIAS_DR } from "@/lib/dgii/catalogos";
import { validateRNC } from "@/lib/validators";
import { traducirError } from "@/lib/errorTranslator";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface WizardData {
  rnc: string;
  razon_social: string;
  nombre_comercial: string;
  direccion: string;
  provincia: string;
  municipio: string;
  telefono: string;
  email: string;
  ambiente: string;
  certificado_file: File | null;
  certificado_password: string;
}

const EMPTY: WizardData = {
  rnc: "", razon_social: "", nombre_comercial: "", direccion: "",
  provincia: "", municipio: "", telefono: "", email: "",
  ambiente: "TesteCF", certificado_file: null, certificado_password: "",
};

const STEPS = ["Datos del emisor", "Ambiente DGII", "Certificado digital", "Resumen"];

export default function EcfSetupWizard({ open, onOpenChange, onComplete }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    // Pre-fill from existing config
    Promise.all([
      supabase.from("ecf_configuracion").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("configuracion_negocio").select("*").eq("user_id", user.id).maybeSingle(),
    ]).then(([ecfRes, negRes]) => {
      const ecf = ecfRes.data as any;
      const neg = negRes.data as any;
      setData({
        rnc: ecf?.rnc || neg?.rnc || "",
        razon_social: ecf?.razon_social || neg?.razon_social || neg?.nombre_comercial || "",
        nombre_comercial: ecf?.nombre_comercial || neg?.nombre_comercial || "",
        direccion: ecf?.direccion || neg?.direccion || "",
        provincia: ecf?.provincia || "",
        municipio: ecf?.municipio || "",
        telefono: ecf?.telefono || neg?.telefono || "",
        email: ecf?.email || neg?.email || "",
        ambiente: ecf?.ambiente || "TesteCF",
        certificado_file: null,
        certificado_password: "",
      });
      setStep(0);
    });
  }, [open, user]);

  const next = () => {
    // Validate per step
    if (step === 0) {
      if (!validateRNC(data.rnc) || !data.rnc) { toast.error("RNC inválido (9 u 11 dígitos)"); return; }
      if (!data.razon_social.trim()) { toast.error("La razón social es obligatoria"); return; }
      if (!data.provincia) { toast.error("Selecciona la provincia"); return; }
    }
    if (step === 2) {
      // Certificate is optional during setup; user can upload later
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const ambiente = AMBIENTES_DGII.find(a => a.codigo === data.ambiente)!;
      let certificado_path: string | null = null;
      let certificado_nombre: string | null = null;

      // Upload certificate if provided
      if (data.certificado_file) {
        const ext = data.certificado_file.name.split(".").pop()?.toLowerCase();
        if (ext !== "pfx" && ext !== "p12") {
          throw new Error("El certificado debe ser .pfx o .p12");
        }
        const path = `${user.id}/cert_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("certificados-ecf")
          .upload(path, data.certificado_file, { upsert: true, contentType: "application/x-pkcs12" });
        if (upErr) throw upErr;
        certificado_path = path;
        certificado_nombre = data.certificado_file.name;
      }

      const payload: any = {
        user_id: user.id,
        rnc: data.rnc.replace(/\D/g, ""),
        razon_social: data.razon_social.trim(),
        nombre_comercial: data.nombre_comercial.trim() || null,
        direccion: data.direccion.trim() || null,
        provincia: data.provincia || null,
        municipio: data.municipio.trim() || null,
        telefono: data.telefono.trim() || null,
        email: data.email.trim() || null,
        ambiente: data.ambiente,
        url_autenticacion: ambiente.urls.autenticacion,
        url_recepcion: ambiente.urls.recepcion,
        url_consulta_estado: ambiente.urls.consulta_estado,
        url_aprobacion_comercial: ambiente.urls.aprobacion_comercial,
        url_anulacion: ambiente.urls.anulacion,
        activo: true,
      };
      if (certificado_path) {
        payload.certificado_path = certificado_path;
        payload.certificado_nombre = certificado_nombre;
      }

      // Upsert
      const { data: existing } = await supabase.from("ecf_configuracion")
        .select("id").eq("user_id", user.id).maybeSingle();

      if (existing) {
        const { error } = await supabase.from("ecf_configuracion").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ecf_configuracion").insert(payload);
        if (error) throw error;
      }

      // Cifrar y guardar la contraseña del .pfx vía edge function (AES-GCM con SERVICE_ROLE_KEY)
      if (data.certificado_password && certificado_path) {
        const { error: encErr } = await supabase.functions.invoke("ecf-encrypt-password", {
          body: {
            password: data.certificado_password,
            certificado_path,
            certificado_nombre,
          },
        });
        if (encErr) throw encErr;
      }

      toast.success("Configuración e-CF guardada correctamente");
      onComplete();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(traducirError(err.message || "Error al guardar la configuración"));
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Configuración de Facturación Electrónica (e-CF)
          </DialogTitle>
          <DialogDescription>
            Paso {step + 1} de {STEPS.length}: {STEPS[step]}
          </DialogDescription>
          <Progress value={progress} className="h-2 mt-2" />
        </DialogHeader>

        {step === 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Datos del emisor</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>RNC *</Label>
                <Input
                  value={data.rnc}
                  onChange={e => setData(d => ({ ...d, rnc: e.target.value.replace(/\D/g, "").slice(0, 11) }))}
                  placeholder="9 dígitos (RNC) o 11 (cédula)"
                  maxLength={11}
                />
              </div>
              <div>
                <Label>Razón social *</Label>
                <Input value={data.razon_social} onChange={e => setData(d => ({ ...d, razon_social: e.target.value }))} />
              </div>
              <div>
                <Label>Nombre comercial</Label>
                <Input value={data.nombre_comercial} onChange={e => setData(d => ({ ...d, nombre_comercial: e.target.value }))} />
              </div>
              <div>
                <Label>Provincia *</Label>
                <Select value={data.provincia} onValueChange={v => setData(d => ({ ...d, provincia: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona provincia" /></SelectTrigger>
                  <SelectContent>
                    {PROVINCIAS_DR.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Municipio</Label>
                <Input value={data.municipio} onChange={e => setData(d => ({ ...d, municipio: e.target.value }))} />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={data.telefono} onChange={e => setData(d => ({ ...d, telefono: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>Dirección</Label>
                <Input value={data.direccion} onChange={e => setData(d => ({ ...d, direccion: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>Email</Label>
                <Input type="email" value={data.email} onChange={e => setData(d => ({ ...d, email: e.target.value }))} />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Ambiente DGII</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {AMBIENTES_DGII.map(amb => (
                <button
                  key={amb.codigo}
                  onClick={() => setData(d => ({ ...d, ambiente: amb.codigo }))}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    data.ambiente === amb.codigo ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {data.ambiente === amb.codigo
                      ? <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 mt-0.5 shrink-0" />}
                    <div>
                      <p className="font-medium">{amb.nombre}</p>
                      <p className="text-sm text-muted-foreground">{amb.descripcion}</p>
                    </div>
                  </div>
                </button>
              ))}
              <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-muted/40 rounded">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>Las URLs de la DGII se configurarán automáticamente según el ambiente seleccionado.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Certificado digital (.pfx / .p12)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <Input
                  type="file"
                  accept=".pfx,.p12"
                  onChange={e => setData(d => ({ ...d, certificado_file: e.target.files?.[0] || null }))}
                  className="max-w-sm mx-auto"
                />
                {data.certificado_file && (
                  <p className="text-sm text-primary mt-2 font-medium">
                    ✓ {data.certificado_file.name} ({(data.certificado_file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
              <div>
                <Label>Contraseña del certificado</Label>
                <Input
                  type="password"
                  value={data.certificado_password}
                  onChange={e => setData(d => ({ ...d, certificado_password: e.target.value }))}
                  placeholder="Contraseña del archivo .pfx"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  La contraseña se guarda cifrada. Necesaria para firmar XML e-CF.
                </p>
              </div>
              <div className="text-xs text-muted-foreground p-3 bg-muted/40 rounded">
                <strong>Opcional:</strong> Puedes saltar este paso y subir el certificado más tarde desde Configuraciones.
                El certificado es requerido para firmar y enviar e-CF a la DGII en producción.
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Resumen</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row k="RNC" v={data.rnc} />
              <Row k="Razón social" v={data.razon_social} />
              <Row k="Nombre comercial" v={data.nombre_comercial || "—"} />
              <Row k="Provincia / Municipio" v={`${data.provincia}${data.municipio ? " / " + data.municipio : ""}`} />
              <Row k="Ambiente DGII" v={AMBIENTES_DGII.find(a => a.codigo === data.ambiente)?.nombre || data.ambiente} />
              <Row k="Certificado" v={data.certificado_file ? data.certificado_file.name : "No subido (configurable después)"} />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={prev} disabled={step === 0 || saving}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Atrás
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Siguiente <ChevronRight className="ml-1 h-4 w-4" /></Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finalizar configuración
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-border/50 py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}