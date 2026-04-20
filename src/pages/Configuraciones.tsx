
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
import { Save, Building2, Settings2, Hash, Loader2, Printer, Package, ShieldAlert, MonitorSmartphone, AlertTriangle, Calendar } from "lucide-react";
import { traducirError } from "@/lib/errorTranslator";
import EditNumeracionModal from "@/components/ecf/EditNumeracionModal";
import EcfSetupWizard from "@/components/ecf/EcfSetupWizard";
import { ShieldCheck, Pencil, Plus } from "lucide-react";

interface Config {
  nombre_comercial: string;
  razon_social: string;
  rnc: string;
  direccion: string;
  telefono: string;
  whatsapp: string;
  email: string;
  mensaje_factura: string;
  itbis_rate: number;
  moneda: string;
  impresion_automatica: boolean;
  formato_impresion: string;
  logo_url: string;
}

interface NcfSeq {
  id: string;
  tipo_comprobante: string;
  secuencia_actual: number;
  secuencia_limite: number;
  activo: boolean;
  fecha_autorizacion: string | null;
  fecha_vencimiento: string | null;
}

const DEFAULT_CONFIG: Config = {
  nombre_comercial: "", razon_social: "", rnc: "", direccion: "", telefono: "", whatsapp: "",
  email: "", mensaje_factura: "Gracias por su compra", itbis_rate: 0.18, moneda: "RD$",
  impresion_automatica: false, formato_impresion: "carta", logo_url: "",
};

// Corrected labels per DGII standard
const COMPROBANTE_LABELS: Record<string, string> = {
  B01: "Crédito Fiscal",
  B02: "Consumidor Final",
  B04: "Nota de Crédito",
  B14: "Gubernamental",
  B15: "Regímenes Especiales",
};

export default function Configuraciones() {
  const { user } = useAuth();
  const { isAdmin, loading: permLoading } = usePermissions();
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [ncfSeqs, setNcfSeqs] = useState<NcfSeq[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editNumModal, setEditNumModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [setupWizard, setSetupWizard] = useState(false);

  // POS config state
  const [posConfig, setPosConfig] = useState(() => {
    const saved = localStorage.getItem("posConfig");
    if (saved) return JSON.parse(saved);
    return {
      confirmacion_cobro: true,
      sonido_escaner: false,
      modo_rapido: false,
      pantalla_completa: false,
      bloqueo_precios: true,
      descuentos_activos: true,
      bloquear_sin_stock: false,
      stock_negativo: false,
    };
  });

  useEffect(() => {
    localStorage.setItem("posConfig", JSON.stringify(posConfig));
  }, [posConfig]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [configRes, ncfRes] = await Promise.all([
      supabase.from("configuracion_negocio").select("*").limit(1).maybeSingle(),
      supabase.from("ncf_secuencias").select("*").order("tipo_comprobante"),
    ]);

    if (configRes.data) {
      const d = configRes.data as any;
      setConfig({
        nombre_comercial: d.nombre_comercial || "",
        razon_social: d.razon_social || "",
        rnc: d.rnc || "",
        direccion: d.direccion || "",
        telefono: d.telefono || "",
        whatsapp: d.whatsapp || "",
        email: d.email || "",
        mensaje_factura: d.mensaje_factura || "",
        itbis_rate: Number(d.itbis_rate) || 0.18,
        moneda: d.moneda || "RD$",
        impresion_automatica: d.impresion_automatica || false,
        formato_impresion: d.formato_impresion || "carta",
        logo_url: d.logo_url || "",
      });
    }

    setNcfSeqs((ncfRes.data as any) || []);
    setLoading(false);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from("configuracion_negocio").select("id, user_id").limit(1).maybeSingle();
    let error;
    if (existing) {
      const { error: updErr } = await supabase.from("configuracion_negocio").update({ ...config } as any).eq("id", existing.id);
      error = updErr;
    } else {
      const { error: insErr } = await supabase.from("configuracion_negocio").insert({ user_id: user!.id, ...config } as any);
      error = insErr;
    }

    if (error) toast.error(traducirError(error.message));
    else {
      toast.success("Configuración guardada");
      await supabase.from("audit_logs").insert({
        user_id: user!.id, accion: "actualizar_config", entidad: "configuracion_negocio", detalles: config,
      } as any);
    }
    setSaving(false);
  };

  const handleSaveNcf = async (seq: NcfSeq) => {
    const { error } = await supabase.from("ncf_secuencias")
      .update({
        secuencia_limite: seq.secuencia_limite,
        activo: seq.activo,
        fecha_autorizacion: seq.fecha_autorizacion || null,
        fecha_vencimiento: seq.fecha_vencimiento || null,
      } as any)
      .eq("id", seq.id);
    if (error) toast.error(traducirError(error.message));
    else toast.success("Secuencia actualizada");
  };

  const initNcfSeq = async (tipo: string) => {
    const { error } = await supabase.from("ncf_secuencias").insert({
      user_id: user!.id,
      tipo_comprobante: tipo,
      secuencia_actual: 0,
      secuencia_limite: 999999,
      prefijo: tipo,
    } as any);
    if (error) toast.error(traducirError(error.message));
    else { toast.success(`Secuencia ${tipo} creada`); loadData(); }
  };

  const updateField = (field: keyof Config, value: any) => setConfig(prev => ({ ...prev, [field]: value }));

  const getSeqUsagePercent = (seq: NcfSeq) => {
    if (!seq.secuencia_limite || seq.secuencia_limite === 0) return 0;
    return Math.round((seq.secuencia_actual / seq.secuencia_limite) * 100);
  };

  const isSeqExpired = (seq: NcfSeq) => {
    if (!seq.fecha_vencimiento) return false;
    return new Date(seq.fecha_vencimiento) < new Date();
  };

  if (permLoading || loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <ShieldAlert className="h-12 w-12 mb-4 opacity-40" />
        <h2 className="text-lg font-semibold text-foreground">Acceso Restringido</h2>
        <p className="text-sm mt-1">Solo los administradores pueden modificar la configuración.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuraciones</h1>
        <p className="text-muted-foreground">Administra los datos del negocio, POS, impresión y parámetros fiscales</p>
      </div>

      <Tabs defaultValue="negocio">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="negocio"><Building2 className="h-4 w-4 mr-1.5 hidden sm:inline" />Negocio</TabsTrigger>
          <TabsTrigger value="pos"><MonitorSmartphone className="h-4 w-4 mr-1.5 hidden sm:inline" />POS</TabsTrigger>
          <TabsTrigger value="impresion"><Printer className="h-4 w-4 mr-1.5 hidden sm:inline" />Impresión</TabsTrigger>
          <TabsTrigger value="inventario"><Package className="h-4 w-4 mr-1.5 hidden sm:inline" />Inventario</TabsTrigger>
          <TabsTrigger value="fiscal"><Hash className="h-4 w-4 mr-1.5 hidden sm:inline" />Fiscal</TabsTrigger>
        </TabsList>

        {/* Negocio Tab */}
        <TabsContent value="negocio" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Datos del Negocio</CardTitle>
              <CardDescription>Información que aparecerá en las facturas y documentos PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.logo_url && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <img src={config.logo_url} alt="Logo" className="h-14 w-auto object-contain rounded" />
                  <p className="text-xs text-muted-foreground">Logo actual del negocio</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>URL del Logo</Label>
                <Input value={config.logo_url} onChange={e => updateField("logo_url", e.target.value)} placeholder="https://mi-sitio.com/logo.png" />
                <p className="text-xs text-muted-foreground">URL pública de imagen PNG/JPG. Aparecerá en la cabecera del PDF.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre Comercial *</Label>
                  <Input value={config.nombre_comercial} onChange={e => updateField("nombre_comercial", e.target.value)} placeholder="Mi Empresa SRL" />
                </div>
                <div className="space-y-2">
                  <Label>Razón Social</Label>
                  <Input value={config.razon_social} onChange={e => updateField("razon_social", e.target.value)} placeholder="Mi Empresa, S.R.L." />
                </div>
                <div className="space-y-2">
                  <Label>RNC *</Label>
                  <Input value={config.rnc} onChange={e => updateField("rnc", e.target.value)} placeholder="000000000" />
                  <p className="text-xs text-muted-foreground">9 dígitos. Obligatorio para emitir comprobantes fiscales.</p>
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input value={config.direccion} onChange={e => updateField("direccion", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={config.telefono} onChange={e => updateField("telefono", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={config.whatsapp} onChange={e => updateField("whatsapp", e.target.value)} placeholder="+1 809 000 0000" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={config.email} onChange={e => updateField("email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Input value={config.moneda} onChange={e => updateField("moneda", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mensaje al pie de factura</Label>
                <Textarea
                  value={config.mensaje_factura}
                  onChange={e => updateField("mensaje_factura", e.target.value)}
                  placeholder="Ej: Garantías, políticas de devolución, horarios de atención, redes sociales..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">Aparecerá al pie de cada factura PDF (térmica y carta)</p>
              </div>
              <div className="space-y-2">
                <Label>Tasa ITBIS (%)</Label>
                <Input
                  type="number" step="1" className="w-32"
                  value={(config.itbis_rate * 100).toFixed(0)}
                  onChange={e => updateField("itbis_rate", parseFloat(e.target.value) / 100 || 0.18)}
                />
              </div>
              <Button onClick={handleSaveConfig} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Configuración del Negocio
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POS Tab */}
        <TabsContent value="pos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración del Punto de Venta</CardTitle>
              <CardDescription>Opciones operativas para el módulo POS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "confirmacion_cobro", label: "Confirmación antes de cobrar", desc: "Muestra un diálogo de confirmación antes de procesar el pago" },
                { key: "sonido_escaner", label: "Sonido al escanear", desc: "Emite un sonido al detectar un código de barras" },
                { key: "modo_rapido", label: "Modo rápido", desc: "Omite pasos intermedios para agilizar la venta" },
                { key: "pantalla_completa", label: "Pantalla completa automática", desc: "Abre el POS en pantalla completa al entrar" },
                { key: "bloqueo_precios", label: "Bloquear edición de precios (solo admin)", desc: "Los cajeros no podrán modificar precios en el POS" },
                { key: "descuentos_activos", label: "Permitir descuentos", desc: "Habilita el campo de descuento en el POS" },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <Switch
                    checked={(posConfig as any)[item.key]}
                    onCheckedChange={v => setPosConfig((prev: any) => ({ ...prev, [item.key]: v }))}
                  />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                💡 Estas opciones se guardan localmente y se aplicarán al módulo POS.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impresion Tab */}
        <TabsContent value="impresion" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración de Impresión</CardTitle>
              <CardDescription>Formato de papel predeterminado para facturas PDF</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Switch
                  checked={config.impresion_automatica}
                  onCheckedChange={v => updateField("impresion_automatica", v)}
                />
                <div>
                  <p className="text-sm font-medium">Impresión automática al facturar</p>
                  <p className="text-xs text-muted-foreground">Abre la ventana de impresión automáticamente al crear factura</p>
                </div>
              </div>
              <div className="space-y-3">
                <Label>Formato de papel predeterminado</Label>
                <div className="grid gap-3 md:grid-cols-3">
                  {([
                    { key: "carta", label: "📄 Carta / A4", desc: "Impresora de oficina, full design con logo y colores" },
                    { key: "80mm", label: "🧾 Térmica 80mm", desc: "Impresora de punto de venta estándar" },
                    { key: "58mm", label: "🧾 Térmica 58mm", desc: "Impresora compacta o portátil" },
                  ] as const).map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => updateField("formato_impresion", opt.key)}
                      className={`flex flex-col items-start p-3 rounded-lg border-2 text-left transition-all ${config.formato_impresion === opt.key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground"
                        }`}
                    >
                      <span className="font-semibold text-sm text-foreground">{opt.label}</span>
                      <span className="text-xs text-muted-foreground mt-1">{opt.desc}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Puedes cambiar el formato al momento de generar cualquier factura también.
                </p>
              </div>
              <Button onClick={handleSaveConfig} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Configuración de Impresión
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventario Tab */}
        <TabsContent value="inventario" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración de Inventario</CardTitle>
              <CardDescription>Control de stock y reglas de inventario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "bloquear_sin_stock", label: "Bloquear venta sin stock", desc: "No permite facturar productos con stock en 0" },
                { key: "stock_negativo", label: "Permitir stock negativo", desc: "Permite que el stock baje a números negativos" },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <Switch
                    checked={(posConfig as any)[item.key]}
                    onCheckedChange={v => setPosConfig((prev: any) => ({ ...prev, [item.key]: v }))}
                  />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2">
                ℹ️ El stock mínimo se configura por producto en el módulo de Productos.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fiscal Tab - Enhanced */}
        <TabsContent value="fiscal" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Secuencias NCF (DGII)</CardTitle>
              <CardDescription>
                Control de numeración fiscal por tipo de comprobante. Configure los rangos autorizados por la DGII.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Expired / near-limit alerts */}
              {ncfSeqs.some(s => isSeqExpired(s) && s.activo) && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <strong>⚠️ Secuencias vencidas:</strong> Tiene secuencias NCF con fecha de vencimiento expirada. 
                    No se podrán emitir comprobantes de esos tipos hasta renovar con la DGII.
                  </div>
                </div>
              )}
              {ncfSeqs.some(s => getSeqUsagePercent(s) >= 90 && s.activo && !isSeqExpired(s)) && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <strong>⚠️ Secuencias próximas a agotarse:</strong> Solicite nuevos rangos a la DGII antes de quedarse sin comprobantes.
                  </div>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Límite</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead>F. Autorización</TableHead>
                    <TableHead>F. Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {["B01", "B02", "B04", "B14", "B15"].map(tipo => {
                    const seq = ncfSeqs.find(s => s.tipo_comprobante === tipo);
                    const usage = seq ? getSeqUsagePercent(seq) : 0;
                    const expired = seq ? isSeqExpired(seq) : false;
                    return (
                      <TableRow key={tipo} className={expired ? "bg-destructive/5" : usage >= 90 ? "bg-amber-500/5" : ""}>
                        <TableCell className="font-mono font-bold">{tipo}</TableCell>
                        <TableCell className="text-sm">{COMPROBANTE_LABELS[tipo]}</TableCell>
                        <TableCell>{seq ? seq.secuencia_actual : "—"}</TableCell>
                        <TableCell>
                          {seq ? (
                            <Input
                              type="number" className="w-28 h-8" value={seq.secuencia_limite}
                              onChange={e => setNcfSeqs(prev => prev.map(s => s.id === seq.id ? { ...s, secuencia_limite: parseInt(e.target.value) || 0 } : s))}
                            />
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          {seq ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${usage >= 90 ? "bg-destructive" : usage >= 70 ? "bg-amber-500" : "bg-primary"}`}
                                  style={{ width: `${Math.min(usage, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{usage}%</span>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          {seq ? (
                            <Input
                              type="date" className="w-36 h-8 text-xs"
                              value={seq.fecha_autorizacion || ""}
                              onChange={e => setNcfSeqs(prev => prev.map(s => s.id === seq.id ? { ...s, fecha_autorizacion: e.target.value || null } : s))}
                            />
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          {seq ? (
                            <div className="space-y-1">
                              <Input
                                type="date" className={`w-36 h-8 text-xs ${expired ? "border-destructive" : ""}`}
                                value={seq.fecha_vencimiento || ""}
                                onChange={e => setNcfSeqs(prev => prev.map(s => s.id === seq.id ? { ...s, fecha_vencimiento: e.target.value || null } : s))}
                              />
                              {expired && (
                                <p className="text-[10px] text-destructive font-medium">VENCIDA</p>
                              )}
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          {seq ? (
                            <Badge variant={expired ? "destructive" : seq.activo ? "default" : "secondary"}>
                              {expired ? "Vencida" : seq.activo ? "Activa" : "Inactiva"}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Sin iniciar</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {seq ? (
                            <Button size="sm" variant="outline" onClick={() => handleSaveNcf(seq)}>
                              <Save className="h-3 w-3 mr-1" /> Guardar
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => initNcfSeq(tipo)}>Iniciar</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
                <p><strong>📋 Instrucciones DGII:</strong></p>
                <p>• Los rangos de secuencias NCF son asignados por la DGII a través de la Oficina Virtual.</p>
                <p>• Configure la <strong>Fecha de Autorización</strong> y <strong>Fecha de Vencimiento</strong> según la autorización recibida.</p>
                <p>• El sistema bloqueará la emisión si la secuencia está vencida o agotada.</p>
                <p>• Se mostrará una alerta cuando el uso supere el 90%.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

}
