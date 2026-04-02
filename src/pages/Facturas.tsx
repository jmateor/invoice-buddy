
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
import { Search, FileText, Ban, Download, Printer, MessageCircle, RotateCcw, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { generateInvoicePDF, type NegocioData } from "@/lib/generateInvoicePDF";
import { exportToExcel } from "@/lib/exportUtils";
import NotaCreditoModal from "@/components/NotaCreditoModal";
import FacturaPreviewModal from "@/components/FacturaPreviewModal";
import { traducirError } from "@/lib/errorTranslator";

interface Factura {
  id: string;
  numero: string;
  fecha: string;
  subtotal: number;
  itbis: number;
  descuento: number;
  total: number;
  metodo_pago: string;
  estado: string;
  notas: string | null;
  cliente_id: string;
  clientes: { nombre: string; rnc_cedula: string | null; direccion: string | null; telefono: string | null; email: string | null } | null;
}

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
      supabase
        .from("facturas")
        .select("*, clientes(nombre, rnc_cedula, direccion, telefono, email)")
        .order("created_at", { ascending: false }),
      supabase
        .from("configuracion_negocio")
        .select("nombre_comercial, razon_social, rnc, direccion, telefono, whatsapp, email, logo_url, mensaje_factura, formato_impresion")
        .maybeSingle(),
    ]);
    setFacturas((facRes.data as any) || []);
    if (negRes.data) {
      const d = negRes.data as any;
      setNegocio({
        nombre_comercial: d.nombre_comercial,
        razon_social: d.razon_social,
        rnc: d.rnc,
        direccion: d.direccion,
        telefono: d.telefono,
        whatsapp: d.whatsapp,
        email: d.email,
        logo_url: d.logo_url,
        mensaje_factura: d.mensaje_factura,
      });
      if (d.formato_impresion) setFormatoImpresion(d.formato_impresion as any);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const handleAnular = async (id: string) => {
    if (!confirm("¿Anular esta factura?")) return;
    const { error } = await supabase.from("facturas").update({ estado: "anulada" as any }).eq("id", id);
    if (error) { toast.error(traducirError(error.message)); return; }
    toast.success("Factura anulada");
    await supabase.from("audit_logs").insert({
      user_id: user!.id,
      accion: "anular_factura",
      entidad: "facturas",
      entidad_id: id,
      detalles: { factura_id: id }
    } as any);
    load();
  };

  const handlePDF = async (f: Factura, action: "download" | "print" | "share") => {
    const { data: detalles } = await supabase
      .from("detalle_facturas")
      .select("cantidad, precio_unitario, itbis, subtotal, productos(nombre, garantia_descripcion, condiciones_garantia)")
      .eq("factura_id", f.id);

    const invoiceData = {
      numero: f.numero,
      fecha: f.fecha,
      cliente: {
        nombre: f.clientes?.nombre || "",
        rnc_cedula: f.clientes?.rnc_cedula,
        direccion: f.clientes?.direccion,
        telefono: f.clientes?.telefono,
        email: f.clientes?.email,
      },
      detalles: (detalles || []).map((d: any) => ({
        nombre: d.productos?.nombre || "",
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        itbis: d.itbis,
        subtotal: d.subtotal,
        garantia: d.productos?.garantia_descripcion || null,
        condiciones_garantia: d.productos?.condiciones_garantia || null,
      })),
      subtotal: Number(f.subtotal),
      itbis: Number(f.itbis),
      descuento: Number(f.descuento),
      total: Number(f.total),
      metodo_pago: f.metodo_pago,
      notas: f.notas,
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
          toast.error("Tu navegador no soporta compartir archivo directamente. Se descargará el PDF y luego puedes adjuntarlo.");
          generateInvoicePDF(invoiceData, "download");
          const phone = (f.clientes?.telefono || "").replace(/\D/g, "");
          if (phone) {
            const waMsg = encodeURIComponent(msg);
            window.open(`https://wa.me/${phone}?text=${waMsg}`, "_blank");
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("No se pudo compartir el archivo");
      }
    } else {
      generateInvoicePDF(invoiceData, action);
    }
  };

  const handleExport = () => {
    exportToExcel(facturas.map(f => ({
      Número: f.numero,
      Cliente: f.clientes?.nombre || "",
      Fecha: new Date(f.fecha).toLocaleDateString("es-DO"),
      Subtotal: Number(f.subtotal),
      ITBIS: Number(f.itbis),
      Descuento: Number(f.descuento),
      Total: Number(f.total),
      "Método Pago": f.metodo_pago,
      Estado: f.estado,
    })), "facturas");
    toast.success("Exportado a Excel");
  };

  const filtered = facturas.filter(f =>
    f.numero.includes(search) ||
    (f.clientes?.nombre || "").toLowerCase().includes(search.toLowerCase())
  );

  const metodoPagoLabel: Record<string, string> = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia" };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Facturas</h1>
          <p className="text-muted-foreground">{facturas.length} facturas registradas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Exportar Excel</Button>
          <Link to="/facturas/nueva">
            <Button><FileText className="mr-2 h-4 w-4" />Nueva Factura</Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por número o cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {/* Format selector */}
        <div className="flex items-center gap-1.5 border border-border rounded-md p-1">
          <span className="text-xs text-muted-foreground px-1">Formato:</span>
          {(["carta", "80mm", "58mm"] as const).map(fmt => (
            <Button
              key={fmt}
              size="sm"
              variant={formatoImpresion === fmt ? "default" : "ghost"}
              className="h-7 text-xs"
              onClick={() => setFormatoImpresion(fmt)}
            >
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
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-36">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No hay facturas
                  </TableCell>
                </TableRow>
              ) : filtered.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono font-medium">{f.numero}</TableCell>
                  <TableCell>{f.clientes?.nombre || "—"}</TableCell>
                  <TableCell>{new Date(f.fecha).toLocaleDateString("es-DO")}</TableCell>
                  <TableCell className="font-medium">RD$ {Number(f.total).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{metodoPagoLabel[f.metodo_pago] || f.metodo_pago}</TableCell>
                  <TableCell>
                    <Badge variant={f.estado === "activa" ? "default" : "destructive"}>
                      {f.estado === "activa" ? "Activa" : "Anulada"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setPreviewFactura(f)} title="Ver factura">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handlePDF(f, "download")} title="Descargar PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handlePDF(f, "print")} title="Imprimir">
                        <Printer className="h-4 w-4" />
                      </Button>
                      {f.clientes?.telefono && (
                        <Button variant="ghost" size="icon" title="Compartir WhatsApp/Email" onClick={() => handlePDF(f, "share")}>
                          <MessageCircle className="h-4 w-4 text-accent" />
                        </Button>
                      )}
                      {f.estado === "activa" && (
                        <Button variant="ghost" size="icon" title="Nota de Crédito"
                          onClick={() => setNcModal({
                            facturaId: f.id, numero: f.numero,
                            clienteId: f.cliente_id || "",
                            clienteNombre: f.clientes?.nombre || ""
                          })}
                        >
                          <RotateCcw className="h-4 w-4 text-warning" />
                        </Button>
                      )}
                      {f.estado === "activa" && (
                        <Button variant="ghost" size="icon" onClick={() => handleAnular(f.id)} title="Anular">
                          <Ban className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {previewFactura && (
        <FacturaPreviewModal
          open={!!previewFactura}
          onOpenChange={o => { if (!o) setPreviewFactura(null); }}
          factura={previewFactura}
          negocio={negocio}
        />
      )}

      {ncModal && (
        <NotaCreditoModal
          open={!!ncModal}
          onOpenChange={o => { if (!o) setNcModal(null); }}
          facturaId={ncModal.facturaId}
          facturaNumero={ncModal.numero}
          clienteId={ncModal.clienteId}
          clienteNombre={ncModal.clienteNombre}
          onCreated={load}
        />
      )}
    </div>
  );

}
