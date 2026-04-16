import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, FileText, Ban, Download, Printer, MessageCircle, RotateCcw, Eye, DollarSign, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { generateInvoicePDF, type NegocioData } from "@/lib/generateInvoicePDF";
import { exportToExcel } from "@/lib/exportUtils";
import NotaCreditoModal from "@/components/NotaCreditoModal";
import FacturaPreviewModal from "@/components/FacturaPreviewModal";
import { traducirError } from "@/lib/errorTranslator";

interface Factura {
  id: string; numero: string; fecha: string; subtotal: number;
  itbis: number; descuento: number; total: number; metodo_pago: string;
  estado: string; notas: string | null; cliente_id: string;
  ncf: string | null; tipo_comprobante: string | null;
  clientes: { nombre: string; rnc_cedula: string | null; direccion: string | null; telefono: string | null; email: string | null } | null;
}

const ESTADO_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  borrador: { label: "Borrador", variant: "outline" },
  activa: { label: "Activa", variant: "default" },
  emitida: { label: "Emitida", variant: "default" },
  enviada_dgii: { label: "Enviada DGII", variant: "secondary" },
  aceptada: { label: "Aceptada", variant: "default" },
  rechazada: { label: "Rechazada", variant: "destructive" },
  cobrada: { label: "Cobrada", variant: "default" },
  anulada: { label: "Anulada", variant: "destructive" },
};

export default function Facturas() {
  const { user } = useAuth();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [search, setSearch] = useState("");
  const [negocio, setNegocio] = useState<NegocioData | null>(null);
  const [formatoImpresion, setFormatoImpresion] = useState<"carta" | "80mm" | "58mm">("carta");
  const [ncModal, setNcModal] = useState<{ facturaId: string; numero: string; clienteId: string; clienteNombre: string } | null>(null);
  const [previewFactura, setPreviewFactura] = useState<Factura | null>(null);
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>(undefined);
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>(undefined);
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todas");

  const load = async () => {
    const [facRes, negRes] = await Promise.all([
      supabase.from("facturas")
        .select("*, clientes(nombre, rnc_cedula, direccion, telefono, email)")
        .order("created_at", { ascending: false }),
      supabase.from("configuracion_negocio")
        .select("nombre_comercial, razon_social, rnc, direccion, telefono, whatsapp, email, logo_url, mensaje_factura, formato_impresion")
        .maybeSingle(),
    ]);
    setFacturas((facRes.data as any) || []);
    if (negRes.data) {
      const d = negRes.data as any;
      setNegocio({
        nombre_comercial: d.nombre_comercial, razon_social: d.razon_social,
        rnc: d.rnc, direccion: d.direccion, telefono: d.telefono,
        whatsapp: d.whatsapp, email: d.email, logo_url: d.logo_url,
        mensaje_factura: d.mensaje_factura,
      });
      if (d.formato_impresion) setFormatoImpresion(d.formato_impresion as any);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleAnular = async (id: string) => {
    if (!confirm("¿Anular esta factura? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from("facturas").update({ estado: "anulada" as any }).eq("id", id);
    if (error) { toast.error(traducirError(error.message)); return; }
    toast.success("Factura anulada");
    await supabase.from("audit_logs").insert({
      user_id: user!.id, accion: "anular_factura",
      entidad: "facturas", entidad_id: id, detalles: { factura_id: id }
    } as any);
    load();
  };

  const handleEmitir = async (f: Factura) => {
    if (f.estado !== "borrador") return;
    try {
      const { data: ncf, error: ncfErr } = await supabase.rpc("next_ncf" as any, {
        p_user_id: user!.id, p_tipo: f.tipo_comprobante || "B02"
      });
      if (ncfErr) throw ncfErr;
      const { error } = await supabase.from("facturas")
        .update({ estado: "emitida" as any, ncf: ncf as string })
        .eq("id", f.id);
      if (error) throw error;

      // Decrement stock on emit
      const { data: detalles } = await supabase.from("detalle_facturas")
        .select("producto_id, cantidad, productos(tipo)").eq("factura_id", f.id);
      for (const d of (detalles || []) as any[]) {
        if (d.productos?.tipo !== "servicio") {
          await supabase.rpc("decrement_stock" as any, { p_id: d.producto_id, amount: d.cantidad });
        }
      }

      toast.success(`Factura emitida con NCF: ${ncf}`);
      await supabase.from("audit_logs").insert({
        user_id: user!.id, accion: "emitir_factura",
        entidad: "facturas", entidad_id: f.id, detalles: { ncf, tipo: f.tipo_comprobante }
      } as any);
      load();
    } catch (err: any) {
      toast.error(err.message || "Error al emitir");
    }
  };

  const handleGenerarEcf = async (f: Factura) => {
    if (!f.ncf || !f.tipo_comprobante) {
      toast.error("La factura debe tener NCF y tipo de comprobante para generar e-CF");
      return;
    }
    // Map NCF type to e-CF type
    const tipoMap: Record<string, string> = { B01: "31", B02: "32", B14: "44", B15: "31" };
    const tipo_ecf = tipoMap[f.tipo_comprobante];
    if (!tipo_ecf) {
      toast.error(`No se puede generar e-CF para tipo ${f.tipo_comprobante}`);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("ecf-generate", {
        body: { factura_id: f.id, tipo_ecf },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(data.mensaje || `e-CF generado: ${data.encf}`);
      load();
    } catch (err: any) {
      toast.error(err.message || "Error al generar e-CF");
    }
  };

  const handleCobrar = async (f: Factura) => {
    if (!["emitida", "activa", "aceptada"].includes(f.estado)) return;
    const { error } = await supabase.from("facturas").update({ estado: "cobrada" as any }).eq("id", f.id);
    if (error) { toast.error(traducirError(error.message)); return; }
    toast.success("Factura marcada como cobrada");
    load();
  };

  const handlePDF = async (f: Factura, action: "download" | "print" | "share") => {
    const { data: detalles } = await supabase
      .from("detalle_facturas")
      .select("cantidad, precio_unitario, itbis, subtotal, productos(nombre, garantia_descripcion, condiciones_garantia)")
      .eq("factura_id", f.id);

    const invoiceData = {
      numero: f.numero, fecha: f.fecha,
      cliente: {
        nombre: f.clientes?.nombre || "", rnc_cedula: f.clientes?.rnc_cedula,
        direccion: f.clientes?.direccion, telefono: f.clientes?.telefono, email: f.clientes?.email,
      },
      detalles: (detalles || []).map((d: any) => ({
        nombre: d.productos?.nombre || "", cantidad: d.cantidad,
        precio_unitario: d.precio_unitario, itbis: d.itbis, subtotal: d.subtotal,
        garantia: d.productos?.garantia_descripcion || null,
        condiciones_garantia: d.productos?.condiciones_garantia || null,
      })),
      subtotal: Number(f.subtotal), itbis: Number(f.itbis),
      descuento: Number(f.descuento), total: Number(f.total),
      metodo_pago: f.metodo_pago, notas: f.notas,
      ncf: f.ncf || undefined, tipo_comprobante: f.tipo_comprobante || undefined,
      negocio: negocio || undefined,
      formato: action === "share" ? ("80mm" as const) : formatoImpresion,
    };

    if (action === "share") {
      try {
        const pdfBlob = generateInvoicePDF(invoiceData, "blob") as Blob | undefined;
        if (!pdfBlob) throw new Error("No se pudo generar el PDF");
        const file = new File([pdfBlob], `Factura_${f.numero}.pdf`, { type: "application/pdf" });
        const msg = `Hola ${f.clientes?.nombre || ""}, adjunto su factura ${f.numero} por RD$ ${Number(f.total).toLocaleString("es-DO", { minimumFractionDigits: 2 })}. ¡Gracias!`;
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Factura ${f.numero}`, text: msg });
        } else {
          generateInvoicePDF(invoiceData, "download");
          const phone = (f.clientes?.telefono || "").replace(/\D/g, "");
          if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
        }
      } catch { toast.error("No se pudo compartir el archivo"); }
    } else {
      generateInvoicePDF(invoiceData, action);
    }
  };

  const handleExport = () => {
    exportToExcel(facturas.map(f => ({
      Número: f.numero, NCF: f.ncf || "", Tipo: f.tipo_comprobante || "",
      Cliente: f.clientes?.nombre || "", RNC: f.clientes?.rnc_cedula || "",
      Fecha: new Date(f.fecha).toLocaleDateString("es-DO"),
      Subtotal: Number(f.subtotal), ITBIS: Number(f.itbis),
      Descuento: Number(f.descuento), Total: Number(f.total),
      "Método Pago": f.metodo_pago, Estado: f.estado,
    })), "facturas");
    toast.success("Exportado a Excel");
  };

  const filtered = facturas.filter(f => {
    const matchSearch = f.numero.includes(search) ||
      (f.ncf || "").includes(search) ||
      (f.clientes?.nombre || "").toLowerCase().includes(search.toLowerCase());
    const fechaF = new Date(f.fecha);
    const matchDesde = !fechaDesde || fechaF >= new Date(fechaDesde.setHours(0, 0, 0, 0));
    const matchHasta = !fechaHasta || fechaF <= new Date(new Date(fechaHasta).setHours(23, 59, 59, 999));
    const matchEstado = estadoFiltro === "todas" || f.estado === estadoFiltro;
    return matchSearch && matchDesde && matchHasta && matchEstado;
  });

  const canModify = (estado: string) => !["anulada", "cobrada"].includes(estado);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Facturas</h1>
          <p className="text-muted-foreground">{filtered.length} de {facturas.length} facturas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Exportar</Button>
          <Link to="/facturas/nueva"><Button><FileText className="mr-2 h-4 w-4" />Nueva Factura</Button></Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por número, NCF o cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !fechaDesde && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />{fechaDesde ? format(fechaDesde, "dd/MM/yyyy") : "Desde"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={fechaDesde} onSelect={setFechaDesde} initialFocus className="p-3 pointer-events-auto" locale={es} />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !fechaHasta && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />{fechaHasta ? format(fechaHasta, "dd/MM/yyyy") : "Hasta"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={fechaHasta} onSelect={setFechaHasta} initialFocus className="p-3 pointer-events-auto" locale={es} />
          </PopoverContent>
        </Popover>
        <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="emitida">Emitida</SelectItem>
            <SelectItem value="enviada_dgii">Enviada DGII</SelectItem>
            <SelectItem value="aceptada">Aceptada</SelectItem>
            <SelectItem value="rechazada">Rechazada</SelectItem>
            <SelectItem value="cobrada">Cobrada</SelectItem>
            <SelectItem value="anulada">Anulada</SelectItem>
          </SelectContent>
        </Select>
        {(fechaDesde || fechaHasta || estadoFiltro !== "todas") && (
          <Button variant="ghost" size="sm" onClick={() => { setFechaDesde(undefined); setFechaHasta(undefined); setEstadoFiltro("todas"); }}>
            Limpiar filtros
          </Button>
        )}
        <div className="flex items-center gap-1.5 border border-border rounded-md p-1 ml-auto">
          <span className="text-xs text-muted-foreground px-1">Formato:</span>
          {(["carta", "80mm", "58mm"] as const).map(fmt => (
            <Button key={fmt} size="sm" variant={formatoImpresion === fmt ? "default" : "ghost"}
              className="h-7 text-xs" onClick={() => setFormatoImpresion(fmt)}>
              {fmt === "carta" ? "Carta" : fmt}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>NCF</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-44">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />No hay facturas
                  </TableCell>
                </TableRow>
              ) : filtered.map(f => {
                const ec = ESTADO_CONFIG[f.estado] || { label: f.estado, variant: "outline" as const };
                return (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono font-medium">{f.numero}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{f.ncf || "—"}</TableCell>
                    <TableCell>{f.clientes?.nombre || "—"}</TableCell>
                    <TableCell>{new Date(f.fecha).toLocaleDateString("es-DO")}</TableCell>
                    <TableCell className="font-medium">RD$ {Number(f.total).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell><Badge variant={ec.variant}>{ec.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setPreviewFactura(f)} title="Ver"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handlePDF(f, "download")} title="PDF"><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handlePDF(f, "print")} title="Imprimir"><Printer className="h-4 w-4" /></Button>
                        {f.estado === "borrador" && (
                          <Button variant="ghost" size="icon" onClick={() => handleEmitir(f)} title="Emitir con NCF">
                            <FileText className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        {["emitida", "activa", "aceptada"].includes(f.estado) && (
                          <Button variant="ghost" size="icon" onClick={() => handleCobrar(f)} title="Marcar cobrada">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                          </Button>
                        )}
                        {canModify(f.estado) && f.estado !== "borrador" && (
                          <Button variant="ghost" size="icon" title="Nota de Crédito"
                            onClick={() => setNcModal({ facturaId: f.id, numero: f.numero, clienteId: f.cliente_id || "", clienteNombre: f.clientes?.nombre || "" })}>
                            <RotateCcw className="h-4 w-4 text-amber-600" />
                          </Button>
                        )}
                        {canModify(f.estado) && (
                          <Button variant="ghost" size="icon" onClick={() => handleAnular(f.id)} title="Anular">
                            <Ban className="h-4 w-4 text-destructive" />
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

      {previewFactura && (
        <FacturaPreviewModal open={!!previewFactura} onOpenChange={o => { if (!o) setPreviewFactura(null); }}
          factura={previewFactura} negocio={negocio} />
      )}
      {ncModal && (
        <NotaCreditoModal open={!!ncModal} onOpenChange={o => { if (!o) setNcModal(null); }}
          facturaId={ncModal.facturaId} facturaNumero={ncModal.numero}
          clienteId={ncModal.clienteId} clienteNombre={ncModal.clienteNombre} onCreated={load} />
      )}
    </div>
  );
}
