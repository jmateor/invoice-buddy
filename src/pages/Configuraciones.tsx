
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Building2, Settings2, Hash, Loader2, Printer, Package, ShieldAlert, MonitorSmartphone } from "lucide-react";
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
interface Config {
import { traducirError } from "@/lib/errorTranslator";
  nombre_comercial: string;
import { traducirError } from "@/lib/errorTranslator";
  razon_social: string;
import { traducirError } from "@/lib/errorTranslator";
  rnc: string;
import { traducirError } from "@/lib/errorTranslator";
  direccion: string;
import { traducirError } from "@/lib/errorTranslator";
  telefono: string;
import { traducirError } from "@/lib/errorTranslator";
  whatsapp: string;
import { traducirError } from "@/lib/errorTranslator";
  email: string;
import { traducirError } from "@/lib/errorTranslator";
  mensaje_factura: string;
import { traducirError } from "@/lib/errorTranslator";
  itbis_rate: number;
import { traducirError } from "@/lib/errorTranslator";
  moneda: string;
import { traducirError } from "@/lib/errorTranslator";
  impresion_automatica: boolean;
import { traducirError } from "@/lib/errorTranslator";
  formato_impresion: string;
import { traducirError } from "@/lib/errorTranslator";
  logo_url: string;
import { traducirError } from "@/lib/errorTranslator";
}
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
interface NcfSeq {
import { traducirError } from "@/lib/errorTranslator";
  id: string;
import { traducirError } from "@/lib/errorTranslator";
  tipo_comprobante: string;
import { traducirError } from "@/lib/errorTranslator";
  secuencia_actual: number;
import { traducirError } from "@/lib/errorTranslator";
  secuencia_limite: number;
import { traducirError } from "@/lib/errorTranslator";
  activo: boolean;
import { traducirError } from "@/lib/errorTranslator";
}
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
const DEFAULT_CONFIG: Config = {
import { traducirError } from "@/lib/errorTranslator";
  nombre_comercial: "", razon_social: "", rnc: "", direccion: "", telefono: "", whatsapp: "",
import { traducirError } from "@/lib/errorTranslator";
  email: "", mensaje_factura: "Gracias por su compra", itbis_rate: 0.18, moneda: "RD$",
import { traducirError } from "@/lib/errorTranslator";
  impresion_automatica: false, formato_impresion: "carta", logo_url: "",
import { traducirError } from "@/lib/errorTranslator";
};
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
const COMPROBANTE_LABELS: Record<string, string> = {
import { traducirError } from "@/lib/errorTranslator";
  B01: "Consumidor Final",
import { traducirError } from "@/lib/errorTranslator";
  B02: "Crédito Fiscal",
import { traducirError } from "@/lib/errorTranslator";
  B14: "Régimen Especial",
import { traducirError } from "@/lib/errorTranslator";
  B15: "Gubernamental",
import { traducirError } from "@/lib/errorTranslator";
};
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
export default function Configuraciones() {
import { traducirError } from "@/lib/errorTranslator";
  const { user } = useAuth();
import { traducirError } from "@/lib/errorTranslator";
  const { isAdmin, loading: permLoading } = usePermissions();
import { traducirError } from "@/lib/errorTranslator";
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
import { traducirError } from "@/lib/errorTranslator";
  const [ncfSeqs, setNcfSeqs] = useState<NcfSeq[]>([]);
import { traducirError } from "@/lib/errorTranslator";
  const [saving, setSaving] = useState(false);
import { traducirError } from "@/lib/errorTranslator";
  const [loading, setLoading] = useState(true);
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  // POS config state
import { traducirError } from "@/lib/errorTranslator";
  const [posConfig, setPosConfig] = useState(() => {
import { traducirError } from "@/lib/errorTranslator";
    const saved = localStorage.getItem("posConfig");
import { traducirError } from "@/lib/errorTranslator";
    if (saved) return JSON.parse(saved);
import { traducirError } from "@/lib/errorTranslator";
    return {
import { traducirError } from "@/lib/errorTranslator";
      confirmacion_cobro: true,
import { traducirError } from "@/lib/errorTranslator";
      sonido_escaner: false,
import { traducirError } from "@/lib/errorTranslator";
      modo_rapido: false,
import { traducirError } from "@/lib/errorTranslator";
      pantalla_completa: false,
import { traducirError } from "@/lib/errorTranslator";
      bloqueo_precios: true,
import { traducirError } from "@/lib/errorTranslator";
      descuentos_activos: true,
import { traducirError } from "@/lib/errorTranslator";
      bloquear_sin_stock: false,
import { traducirError } from "@/lib/errorTranslator";
      stock_negativo: false,
import { traducirError } from "@/lib/errorTranslator";
    };
import { traducirError } from "@/lib/errorTranslator";
  });
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  useEffect(() => {
import { traducirError } from "@/lib/errorTranslator";
    localStorage.setItem("posConfig", JSON.stringify(posConfig));
import { traducirError } from "@/lib/errorTranslator";
  }, [posConfig]);
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  // Print config state
import { traducirError } from "@/lib/errorTranslator";
  // printConfig removed – now stored in main config.formato_impresion
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  useEffect(() => {
import { traducirError } from "@/lib/errorTranslator";
    if (!user) return;
import { traducirError } from "@/lib/errorTranslator";
    loadData();
import { traducirError } from "@/lib/errorTranslator";
  }, [user]);
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const loadData = async () => {
import { traducirError } from "@/lib/errorTranslator";
    setLoading(true);
import { traducirError } from "@/lib/errorTranslator";
    const [configRes, ncfRes] = await Promise.all([
import { traducirError } from "@/lib/errorTranslator";
      supabase.from("configuracion_negocio").select("*").limit(1).maybeSingle(),
import { traducirError } from "@/lib/errorTranslator";
      supabase.from("ncf_secuencias").select("*").order("tipo_comprobante"),
import { traducirError } from "@/lib/errorTranslator";
    ]);
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
    if (configRes.data) {
import { traducirError } from "@/lib/errorTranslator";
      const d = configRes.data as any;
import { traducirError } from "@/lib/errorTranslator";
      setConfig({
import { traducirError } from "@/lib/errorTranslator";
        nombre_comercial: d.nombre_comercial || "",
import { traducirError } from "@/lib/errorTranslator";
        razon_social: d.razon_social || "",
import { traducirError } from "@/lib/errorTranslator";
        rnc: d.rnc || "",
import { traducirError } from "@/lib/errorTranslator";
        direccion: d.direccion || "",
import { traducirError } from "@/lib/errorTranslator";
        telefono: d.telefono || "",
import { traducirError } from "@/lib/errorTranslator";
        whatsapp: d.whatsapp || "",
import { traducirError } from "@/lib/errorTranslator";
        email: d.email || "",
import { traducirError } from "@/lib/errorTranslator";
        mensaje_factura: d.mensaje_factura || "",
import { traducirError } from "@/lib/errorTranslator";
        itbis_rate: Number(d.itbis_rate) || 0.18,
import { traducirError } from "@/lib/errorTranslator";
        moneda: d.moneda || "RD$",
import { traducirError } from "@/lib/errorTranslator";
        impresion_automatica: d.impresion_automatica || false,
import { traducirError } from "@/lib/errorTranslator";
        formato_impresion: d.formato_impresion || "carta",
import { traducirError } from "@/lib/errorTranslator";
        logo_url: d.logo_url || "",
import { traducirError } from "@/lib/errorTranslator";
      });
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
    setNcfSeqs((ncfRes.data as any) || []);
import { traducirError } from "@/lib/errorTranslator";
    setLoading(false);
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleSaveConfig = async () => {
import { traducirError } from "@/lib/errorTranslator";
    setSaving(true);
import { traducirError } from "@/lib/errorTranslator";
    // Para entornos unificados, si ya existe configuración para alguien más pero queremos sobreescribirla o crearla
import { traducirError } from "@/lib/errorTranslator";
    const { data: existing } = await supabase.from("configuracion_negocio").select("id, user_id").limit(1).maybeSingle();
import { traducirError } from "@/lib/errorTranslator";
    let error;
import { traducirError } from "@/lib/errorTranslator";
    if (existing) {
import { traducirError } from "@/lib/errorTranslator";
      const { error: updErr } = await supabase.from("configuracion_negocio").update({ ...config } as any).eq("id", existing.id);
import { traducirError } from "@/lib/errorTranslator";
      error = updErr;
import { traducirError } from "@/lib/errorTranslator";
    } else {
import { traducirError } from "@/lib/errorTranslator";
      const { error: insErr } = await supabase.from("configuracion_negocio").insert({ user_id: user!.id, ...config } as any);
import { traducirError } from "@/lib/errorTranslator";
      error = insErr;
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
    if (error) toast.error(traducirError(error.message));
import { traducirError } from "@/lib/errorTranslator";
    else {
import { traducirError } from "@/lib/errorTranslator";
      toast.success("Configuración guardada");
import { traducirError } from "@/lib/errorTranslator";
      await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
        user_id: user!.id, accion: "actualizar_config", entidad: "configuracion_negocio", detalles: config,
import { traducirError } from "@/lib/errorTranslator";
      } as any);
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";
    setSaving(false);
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleSaveNcf = async (seq: NcfSeq) => {
import { traducirError } from "@/lib/errorTranslator";
    const { error } = await supabase.from("ncf_secuencias")
import { traducirError } from "@/lib/errorTranslator";
      .update({ secuencia_limite: seq.secuencia_limite, activo: seq.activo } as any)
import { traducirError } from "@/lib/errorTranslator";
      .eq("id", seq.id);
import { traducirError } from "@/lib/errorTranslator";
    if (error) toast.error(traducirError(error.message));
import { traducirError } from "@/lib/errorTranslator";
    else toast.success("Secuencia actualizada");
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const initNcfSeq = async (tipo: string) => {
import { traducirError } from "@/lib/errorTranslator";
    const { error } = await supabase.from("ncf_secuencias").insert({
import { traducirError } from "@/lib/errorTranslator";
      user_id: user!.id,
import { traducirError } from "@/lib/errorTranslator";
      tipo_comprobante: tipo,
import { traducirError } from "@/lib/errorTranslator";
      secuencia_actual: 0,
import { traducirError } from "@/lib/errorTranslator";
      secuencia_limite: 999999,
import { traducirError } from "@/lib/errorTranslator";
      prefijo: tipo,
import { traducirError } from "@/lib/errorTranslator";
    } as any);
import { traducirError } from "@/lib/errorTranslator";
    if (error) toast.error(traducirError(error.message));
import { traducirError } from "@/lib/errorTranslator";
    else { toast.success(`Secuencia ${tipo} creada`); loadData(); }
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const updateField = (field: keyof Config, value: any) => setConfig(prev => ({ ...prev, [field]: value }));
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  if (permLoading || loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  if (!isAdmin) {
import { traducirError } from "@/lib/errorTranslator";
    return (
import { traducirError } from "@/lib/errorTranslator";
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
import { traducirError } from "@/lib/errorTranslator";
        <ShieldAlert className="h-12 w-12 mb-4 opacity-40" />
import { traducirError } from "@/lib/errorTranslator";
        <h2 className="text-lg font-semibold text-foreground">Acceso Restringido</h2>
import { traducirError } from "@/lib/errorTranslator";
        <p className="text-sm mt-1">Solo los administradores pueden modificar la configuración.</p>
import { traducirError } from "@/lib/errorTranslator";
      </div>
import { traducirError } from "@/lib/errorTranslator";
    );
import { traducirError } from "@/lib/errorTranslator";
  }
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  return (
import { traducirError } from "@/lib/errorTranslator";
    <div className="animate-fade-in space-y-6 max-w-4xl">
import { traducirError } from "@/lib/errorTranslator";
      <div>
import { traducirError } from "@/lib/errorTranslator";
        <h1 className="text-2xl font-bold text-foreground">Configuraciones</h1>
import { traducirError } from "@/lib/errorTranslator";
        <p className="text-muted-foreground">Administra los datos del negocio, POS, impresión y parámetros fiscales</p>
import { traducirError } from "@/lib/errorTranslator";
      </div>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
      <Tabs defaultValue="negocio">
import { traducirError } from "@/lib/errorTranslator";
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
import { traducirError } from "@/lib/errorTranslator";
          <TabsTrigger value="negocio"><Building2 className="h-4 w-4 mr-1.5 hidden sm:inline" />Negocio</TabsTrigger>
import { traducirError } from "@/lib/errorTranslator";
          <TabsTrigger value="pos"><MonitorSmartphone className="h-4 w-4 mr-1.5 hidden sm:inline" />POS</TabsTrigger>
import { traducirError } from "@/lib/errorTranslator";
          <TabsTrigger value="impresion"><Printer className="h-4 w-4 mr-1.5 hidden sm:inline" />Impresión</TabsTrigger>
import { traducirError } from "@/lib/errorTranslator";
          <TabsTrigger value="inventario"><Package className="h-4 w-4 mr-1.5 hidden sm:inline" />Inventario</TabsTrigger>
import { traducirError } from "@/lib/errorTranslator";
          <TabsTrigger value="fiscal"><Hash className="h-4 w-4 mr-1.5 hidden sm:inline" />Fiscal</TabsTrigger>
import { traducirError } from "@/lib/errorTranslator";
        </TabsList>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
        {/* Negocio Tab */}
import { traducirError } from "@/lib/errorTranslator";
        <TabsContent value="negocio" className="mt-4">
import { traducirError } from "@/lib/errorTranslator";
          <Card>
import { traducirError } from "@/lib/errorTranslator";
            <CardHeader>
import { traducirError } from "@/lib/errorTranslator";
              <CardTitle className="text-base">Datos del Negocio</CardTitle>
import { traducirError } from "@/lib/errorTranslator";
              <CardDescription>Información que aparecerá en las facturas y documentos PDF</CardDescription>
import { traducirError } from "@/lib/errorTranslator";
            </CardHeader>
import { traducirError } from "@/lib/errorTranslator";
            <CardContent className="space-y-4">
import { traducirError } from "@/lib/errorTranslator";
              {/* Logo preview */}
import { traducirError } from "@/lib/errorTranslator";
              {config.logo_url && (
import { traducirError } from "@/lib/errorTranslator";
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
import { traducirError } from "@/lib/errorTranslator";
                  <img src={config.logo_url} alt="Logo" className="h-14 w-auto object-contain rounded" />
import { traducirError } from "@/lib/errorTranslator";
                  <p className="text-xs text-muted-foreground">Logo actual del negocio</p>
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
              )}
import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                <Label>URL del Logo</Label>
import { traducirError } from "@/lib/errorTranslator";
                <Input value={config.logo_url} onChange={e => updateField("logo_url", e.target.value)} placeholder="https://mi-sitio.com/logo.png" />
import { traducirError } from "@/lib/errorTranslator";
                <p className="text-xs text-muted-foreground">URL pública de imagen PNG/JPG. Aparecerá en la cabecera del PDF.</p>
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";
              <div className="grid gap-4 md:grid-cols-2">
import { traducirError } from "@/lib/errorTranslator";
                <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                  <Label>Nombre Comercial *</Label>
import { traducirError } from "@/lib/errorTranslator";
                  <Input value={config.nombre_comercial} onChange={e => updateField("nombre_comercial", e.target.value)} placeholder="Mi Empresa SRL" />
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                  <Label>Razón Social</Label>
import { traducirError } from "@/lib/errorTranslator";
                  <Input value={config.razon_social} onChange={e => updateField("razon_social", e.target.value)} placeholder="Mi Empresa, S.R.L." />
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                  <Label>RNC</Label>
import { traducirError } from "@/lib/errorTranslator";
                  <Input value={config.rnc} onChange={e => updateField("rnc", e.target.value)} placeholder="000-00000-0" />
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                  <Label>Dirección</Label>
import { traducirError } from "@/lib/errorTranslator";
                  <Input value={config.direccion} onChange={e => updateField("direccion", e.target.value)} />
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                  <Label>Teléfono</Label>
import { traducirError } from "@/lib/errorTranslator";
                  <Input value={config.telefono} onChange={e => updateField("telefono", e.target.value)} />
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                  <Label>WhatsApp</Label>
import { traducirError } from "@/lib/errorTranslator";
                  <Input value={config.whatsapp} onChange={e => updateField("whatsapp", e.target.value)} placeholder="+1 809 000 0000" />
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                  <Label>Email</Label>
import { traducirError } from "@/lib/errorTranslator";
                  <Input type="email" value={config.email} onChange={e => updateField("email", e.target.value)} />
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                  <Label>Moneda</Label>
import { traducirError } from "@/lib/errorTranslator";
                  <Input value={config.moneda} onChange={e => updateField("moneda", e.target.value)} />
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                <Label>Mensaje al pie de factura</Label>
import { traducirError } from "@/lib/errorTranslator";
                <Textarea
import { traducirError } from "@/lib/errorTranslator";
                  value={config.mensaje_factura}
import { traducirError } from "@/lib/errorTranslator";
                  onChange={e => updateField("mensaje_factura", e.target.value)}
import { traducirError } from "@/lib/errorTranslator";
                  placeholder="Ej: Garantías, políticas de devolución, horarios de atención, redes sociales..."
import { traducirError } from "@/lib/errorTranslator";
                  rows={4}
import { traducirError } from "@/lib/errorTranslator";
                />
import { traducirError } from "@/lib/errorTranslator";
                <p className="text-xs text-muted-foreground">Aparecerá al pie de cada factura PDF (térmica y carta)</p>
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                <Label>Tasa ITBIS (%)</Label>
import { traducirError } from "@/lib/errorTranslator";
                <Input
import { traducirError } from "@/lib/errorTranslator";
                  type="number" step="1" className="w-32"
import { traducirError } from "@/lib/errorTranslator";
                  value={(config.itbis_rate * 100).toFixed(0)}
import { traducirError } from "@/lib/errorTranslator";
                  onChange={e => updateField("itbis_rate", parseFloat(e.target.value) / 100 || 0.18)}
import { traducirError } from "@/lib/errorTranslator";
                />
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";
              <Button onClick={handleSaveConfig} disabled={saving}>
import { traducirError } from "@/lib/errorTranslator";
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
import { traducirError } from "@/lib/errorTranslator";
                Guardar Configuración del Negocio
import { traducirError } from "@/lib/errorTranslator";
              </Button>
import { traducirError } from "@/lib/errorTranslator";
            </CardContent>
import { traducirError } from "@/lib/errorTranslator";
          </Card>
import { traducirError } from "@/lib/errorTranslator";
        </TabsContent>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
        {/* POS Tab */}
import { traducirError } from "@/lib/errorTranslator";
        <TabsContent value="pos" className="mt-4">
import { traducirError } from "@/lib/errorTranslator";
          <Card>
import { traducirError } from "@/lib/errorTranslator";
            <CardHeader>
import { traducirError } from "@/lib/errorTranslator";
              <CardTitle className="text-base">Configuración del Punto de Venta</CardTitle>
import { traducirError } from "@/lib/errorTranslator";
              <CardDescription>Opciones operativas para el módulo POS</CardDescription>
import { traducirError } from "@/lib/errorTranslator";
            </CardHeader>
import { traducirError } from "@/lib/errorTranslator";
            <CardContent className="space-y-3">
import { traducirError } from "@/lib/errorTranslator";
              {[
import { traducirError } from "@/lib/errorTranslator";
                { key: "confirmacion_cobro", label: "Confirmación antes de cobrar", desc: "Muestra un diálogo de confirmación antes de procesar el pago" },
import { traducirError } from "@/lib/errorTranslator";
                { key: "sonido_escaner", label: "Sonido al escanear", desc: "Emite un sonido al detectar un código de barras" },
import { traducirError } from "@/lib/errorTranslator";
                { key: "modo_rapido", label: "Modo rápido", desc: "Omite pasos intermedios para agilizar la venta" },
import { traducirError } from "@/lib/errorTranslator";
                { key: "pantalla_completa", label: "Pantalla completa automática", desc: "Abre el POS en pantalla completa al entrar" },
import { traducirError } from "@/lib/errorTranslator";
                { key: "bloqueo_precios", label: "Bloquear edición de precios (solo admin)", desc: "Los cajeros no podrán modificar precios en el POS" },
import { traducirError } from "@/lib/errorTranslator";
                { key: "descuentos_activos", label: "Permitir descuentos", desc: "Habilita el campo de descuento en el POS" },
import { traducirError } from "@/lib/errorTranslator";
              ].map(item => (
import { traducirError } from "@/lib/errorTranslator";
                <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg border border-border">
import { traducirError } from "@/lib/errorTranslator";
                  <Switch
import { traducirError } from "@/lib/errorTranslator";
                    checked={(posConfig as any)[item.key]}
import { traducirError } from "@/lib/errorTranslator";
                    onCheckedChange={v => setPosConfig(prev => ({ ...prev, [item.key]: v }))}
import { traducirError } from "@/lib/errorTranslator";
                  />
import { traducirError } from "@/lib/errorTranslator";
                  <div>
import { traducirError } from "@/lib/errorTranslator";
                    <p className="text-sm font-medium">{item.label}</p>
import { traducirError } from "@/lib/errorTranslator";
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
import { traducirError } from "@/lib/errorTranslator";
                  </div>
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
              ))}
import { traducirError } from "@/lib/errorTranslator";
              <p className="text-xs text-muted-foreground pt-2">
import { traducirError } from "@/lib/errorTranslator";
                💡 Estas opciones se guardan localmente y se aplicarán al módulo POS.
import { traducirError } from "@/lib/errorTranslator";
              </p>
import { traducirError } from "@/lib/errorTranslator";
            </CardContent>
import { traducirError } from "@/lib/errorTranslator";
          </Card>
import { traducirError } from "@/lib/errorTranslator";
        </TabsContent>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
        {/* Impresion Tab */}
import { traducirError } from "@/lib/errorTranslator";
        <TabsContent value="impresion" className="mt-4">
import { traducirError } from "@/lib/errorTranslator";
          <Card>
import { traducirError } from "@/lib/errorTranslator";
            <CardHeader>
import { traducirError } from "@/lib/errorTranslator";
              <CardTitle className="text-base">Configuración de Impresión</CardTitle>
import { traducirError } from "@/lib/errorTranslator";
              <CardDescription>Formato de papel predeterminado para facturas PDF</CardDescription>
import { traducirError } from "@/lib/errorTranslator";
            </CardHeader>
import { traducirError } from "@/lib/errorTranslator";
            <CardContent className="space-y-4">
import { traducirError } from "@/lib/errorTranslator";
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
import { traducirError } from "@/lib/errorTranslator";
                <Switch
import { traducirError } from "@/lib/errorTranslator";
                  checked={config.impresion_automatica}
import { traducirError } from "@/lib/errorTranslator";
                  onCheckedChange={v => updateField("impresion_automatica", v)}
import { traducirError } from "@/lib/errorTranslator";
                />
import { traducirError } from "@/lib/errorTranslator";
                <div>
import { traducirError } from "@/lib/errorTranslator";
                  <p className="text-sm font-medium">Impresión automática al facturar</p>
import { traducirError } from "@/lib/errorTranslator";
                  <p className="text-xs text-muted-foreground">Abre la ventana de impresión automáticamente al crear factura</p>
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";
              <div className="space-y-3">
import { traducirError } from "@/lib/errorTranslator";
                <Label>Formato de papel predeterminado</Label>
import { traducirError } from "@/lib/errorTranslator";
                <div className="grid gap-3 md:grid-cols-3">
import { traducirError } from "@/lib/errorTranslator";
                  {([
import { traducirError } from "@/lib/errorTranslator";
                    { key: "carta", label: "📄 Carta / A4", desc: "Impresora de oficina, full design con logo y colores" },
import { traducirError } from "@/lib/errorTranslator";
                    { key: "80mm", label: "🧾 Térmica 80mm", desc: "Impresora de punto de venta estándar" },
import { traducirError } from "@/lib/errorTranslator";
                    { key: "58mm", label: "🧾 Térmica 58mm", desc: "Impresora compacta o portátil" },
import { traducirError } from "@/lib/errorTranslator";
                  ] as const).map(opt => (
import { traducirError } from "@/lib/errorTranslator";
                    <button
import { traducirError } from "@/lib/errorTranslator";
                      key={opt.key}
import { traducirError } from "@/lib/errorTranslator";
                      type="button"
import { traducirError } from "@/lib/errorTranslator";
                      onClick={() => updateField("formato_impresion", opt.key)}
import { traducirError } from "@/lib/errorTranslator";
                      className={`flex flex-col items-start p-3 rounded-lg border-2 text-left transition-all ${config.formato_impresion === opt.key
import { traducirError } from "@/lib/errorTranslator";
                        ? "border-primary bg-primary/5"
import { traducirError } from "@/lib/errorTranslator";
                        : "border-border hover:border-muted-foreground"
import { traducirError } from "@/lib/errorTranslator";
                        }`}
import { traducirError } from "@/lib/errorTranslator";
                    >
import { traducirError } from "@/lib/errorTranslator";
                      <span className="font-semibold text-sm text-foreground">{opt.label}</span>
import { traducirError } from "@/lib/errorTranslator";
                      <span className="text-xs text-muted-foreground mt-1">{opt.desc}</span>
import { traducirError } from "@/lib/errorTranslator";
                    </button>
import { traducirError } from "@/lib/errorTranslator";
                  ))}
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
                <p className="text-xs text-muted-foreground">
import { traducirError } from "@/lib/errorTranslator";
                  Puedes cambiar el formato al momento de generar cualquier factura también.
import { traducirError } from "@/lib/errorTranslator";
                </p>
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";
              <Button onClick={handleSaveConfig} disabled={saving}>
import { traducirError } from "@/lib/errorTranslator";
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
import { traducirError } from "@/lib/errorTranslator";
                Guardar Configuración de Impresión
import { traducirError } from "@/lib/errorTranslator";
              </Button>
import { traducirError } from "@/lib/errorTranslator";
            </CardContent>
import { traducirError } from "@/lib/errorTranslator";
          </Card>
import { traducirError } from "@/lib/errorTranslator";
        </TabsContent>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
        {/* Inventario Tab */}
import { traducirError } from "@/lib/errorTranslator";
        <TabsContent value="inventario" className="mt-4">
import { traducirError } from "@/lib/errorTranslator";
          <Card>
import { traducirError } from "@/lib/errorTranslator";
            <CardHeader>
import { traducirError } from "@/lib/errorTranslator";
              <CardTitle className="text-base">Configuración de Inventario</CardTitle>
import { traducirError } from "@/lib/errorTranslator";
              <CardDescription>Control de stock y reglas de inventario</CardDescription>
import { traducirError } from "@/lib/errorTranslator";
            </CardHeader>
import { traducirError } from "@/lib/errorTranslator";
            <CardContent className="space-y-3">
import { traducirError } from "@/lib/errorTranslator";
              {[
import { traducirError } from "@/lib/errorTranslator";
                { key: "bloquear_sin_stock", label: "Bloquear venta sin stock", desc: "No permite facturar productos con stock en 0" },
import { traducirError } from "@/lib/errorTranslator";
                { key: "stock_negativo", label: "Permitir stock negativo", desc: "Permite que el stock baje a números negativos" },
import { traducirError } from "@/lib/errorTranslator";
              ].map(item => (
import { traducirError } from "@/lib/errorTranslator";
                <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg border border-border">
import { traducirError } from "@/lib/errorTranslator";
                  <Switch
import { traducirError } from "@/lib/errorTranslator";
                    checked={(posConfig as any)[item.key]}
import { traducirError } from "@/lib/errorTranslator";
                    onCheckedChange={v => setPosConfig(prev => ({ ...prev, [item.key]: v }))}
import { traducirError } from "@/lib/errorTranslator";
                  />
import { traducirError } from "@/lib/errorTranslator";
                  <div>
import { traducirError } from "@/lib/errorTranslator";
                    <p className="text-sm font-medium">{item.label}</p>
import { traducirError } from "@/lib/errorTranslator";
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
import { traducirError } from "@/lib/errorTranslator";
                  </div>
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
              ))}
import { traducirError } from "@/lib/errorTranslator";
              <p className="text-xs text-muted-foreground pt-2">
import { traducirError } from "@/lib/errorTranslator";
                ℹ️ El stock mínimo se configura por producto en el módulo de Productos.
import { traducirError } from "@/lib/errorTranslator";
              </p>
import { traducirError } from "@/lib/errorTranslator";
            </CardContent>
import { traducirError } from "@/lib/errorTranslator";
          </Card>
import { traducirError } from "@/lib/errorTranslator";
        </TabsContent>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
        {/* Fiscal Tab */}
import { traducirError } from "@/lib/errorTranslator";
        <TabsContent value="fiscal" className="mt-4">
import { traducirError } from "@/lib/errorTranslator";
          <Card>
import { traducirError } from "@/lib/errorTranslator";
            <CardHeader>
import { traducirError } from "@/lib/errorTranslator";
              <CardTitle className="text-base">Secuencias NCF (DGII)</CardTitle>
import { traducirError } from "@/lib/errorTranslator";
              <CardDescription>Control de numeración fiscal por tipo de comprobante</CardDescription>
import { traducirError } from "@/lib/errorTranslator";
            </CardHeader>
import { traducirError } from "@/lib/errorTranslator";
            <CardContent>
import { traducirError } from "@/lib/errorTranslator";
              <Table>
import { traducirError } from "@/lib/errorTranslator";
                <TableHeader>
import { traducirError } from "@/lib/errorTranslator";
                  <TableRow>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead>Tipo</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead>Descripción</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead>Actual</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead>Límite</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead>Estado</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead></TableHead>
import { traducirError } from "@/lib/errorTranslator";
                  </TableRow>
import { traducirError } from "@/lib/errorTranslator";
                </TableHeader>
import { traducirError } from "@/lib/errorTranslator";
                <TableBody>
import { traducirError } from "@/lib/errorTranslator";
                  {["B01", "B02", "B14", "B15"].map(tipo => {
import { traducirError } from "@/lib/errorTranslator";
                    const seq = ncfSeqs.find(s => s.tipo_comprobante === tipo);
import { traducirError } from "@/lib/errorTranslator";
                    return (
import { traducirError } from "@/lib/errorTranslator";
                      <TableRow key={tipo}>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell className="font-mono font-bold">{tipo}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell className="text-sm">{COMPROBANTE_LABELS[tipo]}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell>{seq ? seq.secuencia_actual : "—"}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                          {seq ? (
import { traducirError } from "@/lib/errorTranslator";
                            <Input
import { traducirError } from "@/lib/errorTranslator";
                              type="number" className="w-28 h-8" value={seq.secuencia_limite}
import { traducirError } from "@/lib/errorTranslator";
                              onChange={e => setNcfSeqs(prev => prev.map(s => s.id === seq.id ? { ...s, secuencia_limite: parseInt(e.target.value) || 0 } : s))}
import { traducirError } from "@/lib/errorTranslator";
                            />
import { traducirError } from "@/lib/errorTranslator";
                          ) : "—"}
import { traducirError } from "@/lib/errorTranslator";
                        </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                          {seq ? (
import { traducirError } from "@/lib/errorTranslator";
                            <Badge variant={seq.activo ? "default" : "secondary"}>
import { traducirError } from "@/lib/errorTranslator";
                              {seq.activo ? "Activo" : "Inactivo"}
import { traducirError } from "@/lib/errorTranslator";
                            </Badge>
import { traducirError } from "@/lib/errorTranslator";
                          ) : (
import { traducirError } from "@/lib/errorTranslator";
                            <Badge variant="outline">Sin iniciar</Badge>
import { traducirError } from "@/lib/errorTranslator";
                          )}
import { traducirError } from "@/lib/errorTranslator";
                        </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                          {seq ? (
import { traducirError } from "@/lib/errorTranslator";
                            <Button size="sm" variant="outline" onClick={() => handleSaveNcf(seq)}>
import { traducirError } from "@/lib/errorTranslator";
                              <Save className="h-3 w-3 mr-1" /> Guardar
import { traducirError } from "@/lib/errorTranslator";
                            </Button>
import { traducirError } from "@/lib/errorTranslator";
                          ) : (
import { traducirError } from "@/lib/errorTranslator";
                            <Button size="sm" onClick={() => initNcfSeq(tipo)}>Iniciar</Button>
import { traducirError } from "@/lib/errorTranslator";
                          )}
import { traducirError } from "@/lib/errorTranslator";
                        </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                      </TableRow>
import { traducirError } from "@/lib/errorTranslator";
                    );
import { traducirError } from "@/lib/errorTranslator";
                  })}
import { traducirError } from "@/lib/errorTranslator";
                </TableBody>
import { traducirError } from "@/lib/errorTranslator";
              </Table>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
              {ncfSeqs.some(s => s.secuencia_actual > s.secuencia_limite * 0.9) && (
import { traducirError } from "@/lib/errorTranslator";
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
import { traducirError } from "@/lib/errorTranslator";
                  ⚠️ Algunas secuencias NCF están cerca del límite. Solicite nuevos rangos a la DGII.
import { traducirError } from "@/lib/errorTranslator";
                </div>
import { traducirError } from "@/lib/errorTranslator";
              )}
import { traducirError } from "@/lib/errorTranslator";
            </CardContent>
import { traducirError } from "@/lib/errorTranslator";
          </Card>
import { traducirError } from "@/lib/errorTranslator";
        </TabsContent>
import { traducirError } from "@/lib/errorTranslator";
      </Tabs>
import { traducirError } from "@/lib/errorTranslator";
    </div>
import { traducirError } from "@/lib/errorTranslator";
  );
import { traducirError } from "@/lib/errorTranslator";
