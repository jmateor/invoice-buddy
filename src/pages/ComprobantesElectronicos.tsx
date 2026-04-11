import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText, Send, Search, Eye, XCircle, RefreshCw, Shield, Loader2, Settings } from "lucide-react";

interface EcfDocumento {
  id: string;
  encf: string;
  tipo_ecf: string;
  receptor_nombre: string | null;
  receptor_rnc: string | null;
  monto_total: number;
  estado_dgii: string;
  track_id: string | null;
  mensaje_dgii: string | null;
  fecha_emision: string;
  fecha_envio: string | null;
  ambiente: string;
  xml_sin_firma: string | null;
  xml_firmado: string | null;
}

interface EcfConfig {
  id?: string;
  rnc: string;
  razon_social: string;
  nombre_comercial: string;
  direccion: string;
  telefono: string;
  email: string;
  municipio: string;
  provincia: string;
  ambiente: string;
}

const TIPOS_ECF: Record<string, string> = {
  '31': 'Factura Crédito Fiscal',
  '32': 'Factura de Consumo',
  '33': 'Nota de Débito',
  '34': 'Nota de Crédito',
};

const ESTADOS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pendiente: { variant: "outline", label: "Pendiente" },
  enviado: { variant: "secondary", label: "Enviado" },
  en_proceso: { variant: "secondary", label: "En Proceso" },
  aceptado: { variant: "default", label: "Aceptado" },
  aceptado_condicional: { variant: "outline", label: "Aceptado Cond." },
  rechazado: { variant: "destructive", label: "Rechazado" },
  anulado: { variant: "destructive", label: "Anulado" },
};

export default function ComprobantesElectronicos() {
  const { user } = useAuth();
  const [documentos, setDocumentos] = useState<EcfDocumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<EcfDocumento | null>(null);
  const [showXml, setShowXml] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showAnular, setShowAnular] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [config, setConfig] = useState<EcfConfig>({
    rnc: "", razon_social: "", nombre_comercial: "", direccion: "",
    telefono: "", email: "", municipio: "", provincia: "", ambiente: "TesteCF",
  });

  const fetchDocumentos = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("ecf_documentos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setDocumentos((data as any) || []);
    setLoading(false);
  };

  const fetchConfig = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ecf_configuracion")
      .select("*")
      .eq("user_id", user.id)
      .eq("activo", true)
      .maybeSingle();
    if (data) {
      setConfig(data as any);
    }
  };

  useEffect(() => {
    fetchDocumentos();
    fetchConfig();
  }, [user]);

  const handleAction = async (action: string, docId: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ecf-dgii-client", {
        body: { action, ecf_documento_id: docId, motivo_anulacion: motivoAnulacion || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(data.mensaje || `Acción '${action}' completada`);
      setShowAnular(false);
      setMotivoAnulacion("");
      fetchDocumentos();
    } catch (err: any) {
      toast.error(err.message || "Error al ejecutar acción");
    }
    setActionLoading(false);
  };

  const handleSaveConfig = async () => {
    if (!user) return;
    if (!config.rnc || !config.razon_social) {
      toast.error("RNC y Razón Social son obligatorios");
      return;
    }
    setActionLoading(true);
    try {
      const payload = { ...config, user_id: user.id, activo: true };
      if ((config as any).id) {
        await supabase.from("ecf_configuracion").update(payload).eq("id", (config as any).id);
      } else {
        await supabase.from("ecf_configuracion").insert(payload);
      }
      toast.success("Configuración fiscal guardada");
      setShowConfig(false);
      fetchConfig();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    }
    setActionLoading(false);
  };

  const filtrados = documentos.filter(d => {
    if (filtroEstado !== "todos" && d.estado_dgii !== filtroEstado) return false;
    if (filtroTipo !== "todos" && d.tipo_ecf !== filtroTipo) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      return d.encf.toLowerCase().includes(q) ||
        (d.receptor_nombre || "").toLowerCase().includes(q) ||
        (d.track_id || "").toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comprobantes Fiscales Electrónicos</h1>
          <p className="text-muted-foreground">Gestión de e-CF según normativa DGII</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowConfig(true)}>
            <Settings className="h-4 w-4 mr-2" /> Configuración Fiscal
          </Button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total e-CF", value: documentos.length, icon: FileText },
          { label: "Aceptados", value: documentos.filter(d => d.estado_dgii === "aceptado").length, icon: Shield },
          { label: "Pendientes", value: documentos.filter(d => d.estado_dgii === "pendiente").length, icon: RefreshCw },
          { label: "Rechazados", value: documentos.filter(d => d.estado_dgii === "rechazado").length, icon: XCircle },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
                <Icon className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <Input placeholder="Buscar por e-NCF, cliente o TrackID..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {Object.entries(ESTADOS_BADGE).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {Object.entries(TIPOS_ECF).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchDocumentos}>
              <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>e-NCF</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado DGII</TableHead>
                <TableHead>TrackID</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay comprobantes fiscales electrónicos
                  </TableCell>
                </TableRow>
              ) : filtrados.map(doc => {
                const badge = ESTADOS_BADGE[doc.estado_dgii] || { variant: "outline" as const, label: doc.estado_dgii };
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-mono text-sm font-medium">{doc.encf}</TableCell>
                    <TableCell className="text-sm">{TIPOS_ECF[doc.tipo_ecf] || doc.tipo_ecf}</TableCell>
                    <TableCell>
                      <div className="text-sm">{doc.receptor_nombre || "—"}</div>
                      {doc.receptor_rnc && <div className="text-xs text-muted-foreground">{doc.receptor_rnc}</div>}
                    </TableCell>
                    <TableCell>RD$ {Number(doc.monto_total).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{doc.track_id || "—"}</TableCell>
                    <TableCell className="text-sm">{new Date(doc.fecha_emision).toLocaleDateString("es-DO")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="Ver XML" onClick={() => { setSelectedDoc(doc); setShowXml(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {doc.estado_dgii === "pendiente" && (
                          <>
                            <Button variant="ghost" size="icon" title="Firmar" onClick={() => handleAction("firmar", doc.id)} disabled={actionLoading}>
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Enviar a DGII" onClick={() => handleAction("enviar", doc.id)} disabled={actionLoading}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {(doc.estado_dgii === "enviado" || doc.estado_dgii === "en_proceso") && (
                          <Button variant="ghost" size="icon" title="Consultar estado" onClick={() => handleAction("consultar", doc.id)} disabled={actionLoading}>
                            <Search className="h-4 w-4" />
                          </Button>
                        )}
                        {doc.estado_dgii !== "anulado" && doc.estado_dgii !== "rechazado" && (
                          <Button variant="ghost" size="icon" title="Anular" onClick={() => { setSelectedDoc(doc); setShowAnular(true); }} disabled={actionLoading}>
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal XML */}
      <Dialog open={showXml} onOpenChange={setShowXml}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>XML del e-CF: {selectedDoc?.encf}</DialogTitle>
          </DialogHeader>
          <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[60vh] text-xs font-mono whitespace-pre-wrap">
            {selectedDoc?.xml_firmado || selectedDoc?.xml_sin_firma || "Sin XML generado"}
          </pre>
        </DialogContent>
      </Dialog>

      {/* Modal Anular */}
      <Dialog open={showAnular} onOpenChange={setShowAnular}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anular e-CF: {selectedDoc?.encf}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo de anulación *</Label>
              <Textarea value={motivoAnulacion} onChange={e => setMotivoAnulacion(e.target.value)} placeholder="Indique el motivo de la anulación..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnular(false)}>Cancelar</Button>
            <Button variant="destructive" disabled={!motivoAnulacion || actionLoading} onClick={() => selectedDoc && handleAction("anular", selectedDoc.id)}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar Anulación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Configuración Fiscal */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configuración Fiscal del Emisor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>RNC *</Label>
                <Input value={config.rnc} onChange={e => setConfig({ ...config, rnc: e.target.value })} placeholder="000-00000-0" />
              </div>
              <div className="space-y-1">
                <Label>Ambiente</Label>
                <Select value={config.ambiente} onValueChange={v => setConfig({ ...config, ambiente: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TesteCF">Pruebas (TesteCF)</SelectItem>
                    <SelectItem value="eCF">Producción (eCF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Razón Social *</Label>
              <Input value={config.razon_social} onChange={e => setConfig({ ...config, razon_social: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Nombre Comercial</Label>
              <Input value={config.nombre_comercial} onChange={e => setConfig({ ...config, nombre_comercial: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Dirección</Label>
              <Input value={config.direccion} onChange={e => setConfig({ ...config, direccion: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Municipio</Label>
                <Input value={config.municipio} onChange={e => setConfig({ ...config, municipio: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Provincia</Label>
                <Input value={config.provincia} onChange={e => setConfig({ ...config, provincia: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Teléfono</Label>
                <Input value={config.telefono} onChange={e => setConfig({ ...config, telefono: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input value={config.email} onChange={e => setConfig({ ...config, email: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfig(false)}>Cancelar</Button>
            <Button onClick={handleSaveConfig} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar Configuración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
