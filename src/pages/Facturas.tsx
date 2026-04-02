
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, FileText, Ban, Download, Printer, MessageCircle, RotateCcw, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { generateInvoicePDF, type NegocioData } from "@/lib/generateInvoicePDF";
import { exportToExcel } from "@/lib/exportUtils";
import NotaCreditoModal from "@/components/NotaCreditoModal";
import FacturaPreviewModal from "@/components/FacturaPreviewModal";
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
interface Factura {
import { traducirError } from "@/lib/errorTranslator";
  id: string;
import { traducirError } from "@/lib/errorTranslator";
  numero: string;
import { traducirError } from "@/lib/errorTranslator";
  fecha: string;
import { traducirError } from "@/lib/errorTranslator";
  subtotal: number;
import { traducirError } from "@/lib/errorTranslator";
  itbis: number;
import { traducirError } from "@/lib/errorTranslator";
  descuento: number;
import { traducirError } from "@/lib/errorTranslator";
  total: number;
import { traducirError } from "@/lib/errorTranslator";
  metodo_pago: string;
import { traducirError } from "@/lib/errorTranslator";
  estado: string;
import { traducirError } from "@/lib/errorTranslator";
  notas: string | null;
import { traducirError } from "@/lib/errorTranslator";
  cliente_id: string;
import { traducirError } from "@/lib/errorTranslator";
  clientes: { nombre: string; rnc_cedula: string | null; direccion: string | null; telefono: string | null; email: string | null } | null;
import { traducirError } from "@/lib/errorTranslator";
}
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
export default function Facturas() {
import { traducirError } from "@/lib/errorTranslator";
  const { user } = useAuth();
import { traducirError } from "@/lib/errorTranslator";
  const [facturas, setFacturas] = useState<Factura[]>([]);
import { traducirError } from "@/lib/errorTranslator";
  const [search, setSearch] = useState("");
import { traducirError } from "@/lib/errorTranslator";
  const [negocio, setNegocio] = useState<NegocioData | null>(null);
import { traducirError } from "@/lib/errorTranslator";
  const [formatoImpresion, setFormatoImpresion] = useState<"carta" | "80mm" | "58mm">("carta");
import { traducirError } from "@/lib/errorTranslator";
  const [ncModal, setNcModal] = useState<{ facturaId: string; numero: string; clienteId: string; clienteNombre: string } | null>(null);
import { traducirError } from "@/lib/errorTranslator";
  const [previewFactura, setPreviewFactura] = useState<Factura | null>(null);
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const load = async () => {
import { traducirError } from "@/lib/errorTranslator";
    const [facRes, negRes] = await Promise.all([
import { traducirError } from "@/lib/errorTranslator";
      supabase
import { traducirError } from "@/lib/errorTranslator";
        .from("facturas")
import { traducirError } from "@/lib/errorTranslator";
        .select("*, clientes(nombre, rnc_cedula, direccion, telefono, email)")
import { traducirError } from "@/lib/errorTranslator";
        .order("created_at", { ascending: false }),
import { traducirError } from "@/lib/errorTranslator";
      supabase
import { traducirError } from "@/lib/errorTranslator";
        .from("configuracion_negocio")
import { traducirError } from "@/lib/errorTranslator";
        .select("nombre_comercial, razon_social, rnc, direccion, telefono, whatsapp, email, logo_url, mensaje_factura, formato_impresion")
import { traducirError } from "@/lib/errorTranslator";
        .maybeSingle(),
import { traducirError } from "@/lib/errorTranslator";
    ]);
import { traducirError } from "@/lib/errorTranslator";
    setFacturas((facRes.data as any) || []);
import { traducirError } from "@/lib/errorTranslator";
    if (negRes.data) {
import { traducirError } from "@/lib/errorTranslator";
      const d = negRes.data as any;
import { traducirError } from "@/lib/errorTranslator";
      setNegocio({
import { traducirError } from "@/lib/errorTranslator";
        nombre_comercial: d.nombre_comercial,
import { traducirError } from "@/lib/errorTranslator";
        razon_social: d.razon_social,
import { traducirError } from "@/lib/errorTranslator";
        rnc: d.rnc,
import { traducirError } from "@/lib/errorTranslator";
        direccion: d.direccion,
import { traducirError } from "@/lib/errorTranslator";
        telefono: d.telefono,
import { traducirError } from "@/lib/errorTranslator";
        whatsapp: d.whatsapp,
import { traducirError } from "@/lib/errorTranslator";
        email: d.email,
import { traducirError } from "@/lib/errorTranslator";
        logo_url: d.logo_url,
import { traducirError } from "@/lib/errorTranslator";
        mensaje_factura: d.mensaje_factura,
import { traducirError } from "@/lib/errorTranslator";
      });
import { traducirError } from "@/lib/errorTranslator";
      if (d.formato_impresion) setFormatoImpresion(d.formato_impresion as any);
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  useEffect(() => { if (user) load(); }, [user]);
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleAnular = async (id: string) => {
import { traducirError } from "@/lib/errorTranslator";
    if (!confirm("¿Anular esta factura?")) return;
import { traducirError } from "@/lib/errorTranslator";
    const { error } = await supabase.from("facturas").update({ estado: "anulada" as any }).eq("id", id);
import { traducirError } from "@/lib/errorTranslator";
    if (error) { toast.error(traducirError(error.message)); return; }
import { traducirError } from "@/lib/errorTranslator";
    toast.success("Factura anulada");
import { traducirError } from "@/lib/errorTranslator";
    await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
      user_id: user!.id,
import { traducirError } from "@/lib/errorTranslator";
      accion: "anular_factura",
import { traducirError } from "@/lib/errorTranslator";
      entidad: "facturas",
import { traducirError } from "@/lib/errorTranslator";
      entidad_id: id,
import { traducirError } from "@/lib/errorTranslator";
      detalles: { factura_id: id }
import { traducirError } from "@/lib/errorTranslator";
    } as any);
import { traducirError } from "@/lib/errorTranslator";
    load();
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handlePDF = async (f: Factura, action: "download" | "print" | "share") => {
import { traducirError } from "@/lib/errorTranslator";
    const { data: detalles } = await supabase
import { traducirError } from "@/lib/errorTranslator";
      .from("detalle_facturas")
import { traducirError } from "@/lib/errorTranslator";
      .select("cantidad, precio_unitario, itbis, subtotal, productos(nombre, garantia_descripcion, condiciones_garantia)")
import { traducirError } from "@/lib/errorTranslator";
      .eq("factura_id", f.id);
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
    const invoiceData = {
import { traducirError } from "@/lib/errorTranslator";
      numero: f.numero,
import { traducirError } from "@/lib/errorTranslator";
      fecha: f.fecha,
import { traducirError } from "@/lib/errorTranslator";
      cliente: {
import { traducirError } from "@/lib/errorTranslator";
        nombre: f.clientes?.nombre || "",
import { traducirError } from "@/lib/errorTranslator";
        rnc_cedula: f.clientes?.rnc_cedula,
import { traducirError } from "@/lib/errorTranslator";
        direccion: f.clientes?.direccion,
import { traducirError } from "@/lib/errorTranslator";
        telefono: f.clientes?.telefono,
import { traducirError } from "@/lib/errorTranslator";
        email: f.clientes?.email,
import { traducirError } from "@/lib/errorTranslator";
      },
import { traducirError } from "@/lib/errorTranslator";
      detalles: (detalles || []).map((d: any) => ({
import { traducirError } from "@/lib/errorTranslator";
        nombre: d.productos?.nombre || "",
import { traducirError } from "@/lib/errorTranslator";
        cantidad: d.cantidad,
import { traducirError } from "@/lib/errorTranslator";
        precio_unitario: d.precio_unitario,
import { traducirError } from "@/lib/errorTranslator";
        itbis: d.itbis,
import { traducirError } from "@/lib/errorTranslator";
        subtotal: d.subtotal,
import { traducirError } from "@/lib/errorTranslator";
        garantia: d.productos?.garantia_descripcion || null,
import { traducirError } from "@/lib/errorTranslator";
        condiciones_garantia: d.productos?.condiciones_garantia || null,
import { traducirError } from "@/lib/errorTranslator";
      })),
import { traducirError } from "@/lib/errorTranslator";
      subtotal: Number(f.subtotal),
import { traducirError } from "@/lib/errorTranslator";
      itbis: Number(f.itbis),
import { traducirError } from "@/lib/errorTranslator";
      descuento: Number(f.descuento),
import { traducirError } from "@/lib/errorTranslator";
      total: Number(f.total),
import { traducirError } from "@/lib/errorTranslator";
      metodo_pago: f.metodo_pago,
import { traducirError } from "@/lib/errorTranslator";
      notas: f.notas,
import { traducirError } from "@/lib/errorTranslator";
      negocio: negocio || undefined,
import { traducirError } from "@/lib/errorTranslator";
      formato: action === "share" ? ("80mm" as const) : formatoImpresion,
import { traducirError } from "@/lib/errorTranslator";
    };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
    if (action === "share") {
import { traducirError } from "@/lib/errorTranslator";
      try {
import { traducirError } from "@/lib/errorTranslator";
        const pdfBlob = generateInvoicePDF(invoiceData, "blob") as Blob | undefined;
import { traducirError } from "@/lib/errorTranslator";
        if (!pdfBlob) throw new Error("No se pudo generar el PDF");
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
        const file = new File([pdfBlob], `Factura_${f.numero}.pdf`, { type: "application/pdf" });
import { traducirError } from "@/lib/errorTranslator";
        const msg = `Hola ${f.clientes?.nombre || ""}, adjunto su factura ${f.numero} por RD$ ${Number(f.total).toLocaleString("es-DO", { minimumFractionDigits: 2 })}. ¡Gracias!`;
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
import { traducirError } from "@/lib/errorTranslator";
          await navigator.share({ files: [file], title: `Factura ${f.numero}`, text: msg });
import { traducirError } from "@/lib/errorTranslator";
        } else {
import { traducirError } from "@/lib/errorTranslator";
          toast.error("Tu navegador no soporta compartir archivo directamente. Se descargará el PDF y luego puedes adjuntarlo.");
import { traducirError } from "@/lib/errorTranslator";
          generateInvoicePDF(invoiceData, "download");
import { traducirError } from "@/lib/errorTranslator";
          const phone = (f.clientes?.telefono || "").replace(/\D/g, "");
import { traducirError } from "@/lib/errorTranslator";
          if (phone) {
import { traducirError } from "@/lib/errorTranslator";
            const waMsg = encodeURIComponent(msg);
import { traducirError } from "@/lib/errorTranslator";
            window.open(`https://wa.me/${phone}?text=${waMsg}`, "_blank");
import { traducirError } from "@/lib/errorTranslator";
          }
import { traducirError } from "@/lib/errorTranslator";
        }
import { traducirError } from "@/lib/errorTranslator";
      } catch (err) {
import { traducirError } from "@/lib/errorTranslator";
        console.error(err);
import { traducirError } from "@/lib/errorTranslator";
        toast.error("No se pudo compartir el archivo");
import { traducirError } from "@/lib/errorTranslator";
      }
import { traducirError } from "@/lib/errorTranslator";
    } else {
import { traducirError } from "@/lib/errorTranslator";
      generateInvoicePDF(invoiceData, action);
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleExport = () => {
import { traducirError } from "@/lib/errorTranslator";
    exportToExcel(facturas.map(f => ({
import { traducirError } from "@/lib/errorTranslator";
      Número: f.numero,
import { traducirError } from "@/lib/errorTranslator";
      Cliente: f.clientes?.nombre || "",
import { traducirError } from "@/lib/errorTranslator";
      Fecha: new Date(f.fecha).toLocaleDateString("es-DO"),
import { traducirError } from "@/lib/errorTranslator";
      Subtotal: Number(f.subtotal),
import { traducirError } from "@/lib/errorTranslator";
      ITBIS: Number(f.itbis),
import { traducirError } from "@/lib/errorTranslator";
      Descuento: Number(f.descuento),
import { traducirError } from "@/lib/errorTranslator";
      Total: Number(f.total),
import { traducirError } from "@/lib/errorTranslator";
      "Método Pago": f.metodo_pago,
import { traducirError } from "@/lib/errorTranslator";
      Estado: f.estado,
import { traducirError } from "@/lib/errorTranslator";
    })), "facturas");
import { traducirError } from "@/lib/errorTranslator";
    toast.success("Exportado a Excel");
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const filtered = facturas.filter(f =>
import { traducirError } from "@/lib/errorTranslator";
    f.numero.includes(search) ||
import { traducirError } from "@/lib/errorTranslator";
    (f.clientes?.nombre || "").toLowerCase().includes(search.toLowerCase())
import { traducirError } from "@/lib/errorTranslator";
  );
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const metodoPagoLabel: Record<string, string> = { efectivo: "Efectivo", tarjeta: "Tarjeta", transferencia: "Transferencia" };
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
          <h1 className="text-2xl font-bold text-foreground">Facturas</h1>
import { traducirError } from "@/lib/errorTranslator";
          <p className="text-muted-foreground">{facturas.length} facturas registradas</p>
import { traducirError } from "@/lib/errorTranslator";
        </div>
import { traducirError } from "@/lib/errorTranslator";
        <div className="flex gap-2">
import { traducirError } from "@/lib/errorTranslator";
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Exportar Excel</Button>
import { traducirError } from "@/lib/errorTranslator";
          <Link to="/facturas/nueva">
import { traducirError } from "@/lib/errorTranslator";
            <Button><FileText className="mr-2 h-4 w-4" />Nueva Factura</Button>
import { traducirError } from "@/lib/errorTranslator";
          </Link>
import { traducirError } from "@/lib/errorTranslator";
        </div>
import { traducirError } from "@/lib/errorTranslator";
      </div>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
      <div className="flex items-center gap-4">
import { traducirError } from "@/lib/errorTranslator";
        <div className="relative max-w-sm flex-1">
import { traducirError } from "@/lib/errorTranslator";
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
import { traducirError } from "@/lib/errorTranslator";
          <Input className="pl-9" placeholder="Buscar por número o cliente..." value={search} onChange={e => setSearch(e.target.value)} />
import { traducirError } from "@/lib/errorTranslator";
        </div>
import { traducirError } from "@/lib/errorTranslator";
        {/* Format selector */}
import { traducirError } from "@/lib/errorTranslator";
        <div className="flex items-center gap-1.5 border border-border rounded-md p-1">
import { traducirError } from "@/lib/errorTranslator";
          <span className="text-xs text-muted-foreground px-1">Formato:</span>
import { traducirError } from "@/lib/errorTranslator";
          {(["carta", "80mm", "58mm"] as const).map(fmt => (
import { traducirError } from "@/lib/errorTranslator";
            <Button
import { traducirError } from "@/lib/errorTranslator";
              key={fmt}
import { traducirError } from "@/lib/errorTranslator";
              size="sm"
import { traducirError } from "@/lib/errorTranslator";
              variant={formatoImpresion === fmt ? "default" : "ghost"}
import { traducirError } from "@/lib/errorTranslator";
              className="h-7 text-xs"
import { traducirError } from "@/lib/errorTranslator";
              onClick={() => setFormatoImpresion(fmt)}
import { traducirError } from "@/lib/errorTranslator";
            >
import { traducirError } from "@/lib/errorTranslator";
              {fmt === "carta" ? "Carta" : fmt}
import { traducirError } from "@/lib/errorTranslator";
            </Button>
import { traducirError } from "@/lib/errorTranslator";
          ))}
import { traducirError } from "@/lib/errorTranslator";
        </div>
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
                <TableHead>Número</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>Cliente</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>Fecha</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>Total</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>Pago</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead>Estado</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                <TableHead className="w-36">Acciones</TableHead>
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
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
import { traducirError } from "@/lib/errorTranslator";
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
import { traducirError } from "@/lib/errorTranslator";
                    No hay facturas
import { traducirError } from "@/lib/errorTranslator";
                  </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                </TableRow>
import { traducirError } from "@/lib/errorTranslator";
              ) : filtered.map(f => (
import { traducirError } from "@/lib/errorTranslator";
                <TableRow key={f.id}>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell className="font-mono font-medium">{f.numero}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>{f.clientes?.nombre || "—"}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>{new Date(f.fecha).toLocaleDateString("es-DO")}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell className="font-medium">RD$ {Number(f.total).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>{metodoPagoLabel[f.metodo_pago] || f.metodo_pago}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                    <Badge variant={f.estado === "activa" ? "default" : "destructive"}>
import { traducirError } from "@/lib/errorTranslator";
                      {f.estado === "activa" ? "Activa" : "Anulada"}
import { traducirError } from "@/lib/errorTranslator";
                    </Badge>
import { traducirError } from "@/lib/errorTranslator";
                  </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                  <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                    <div className="flex gap-1">
import { traducirError } from "@/lib/errorTranslator";
                      <Button variant="ghost" size="icon" onClick={() => setPreviewFactura(f)} title="Ver factura">
import { traducirError } from "@/lib/errorTranslator";
                        <Eye className="h-4 w-4" />
import { traducirError } from "@/lib/errorTranslator";
                      </Button>
import { traducirError } from "@/lib/errorTranslator";
                      <Button variant="ghost" size="icon" onClick={() => handlePDF(f, "download")} title="Descargar PDF">
import { traducirError } from "@/lib/errorTranslator";
                        <Download className="h-4 w-4" />
import { traducirError } from "@/lib/errorTranslator";
                      </Button>
import { traducirError } from "@/lib/errorTranslator";
                      <Button variant="ghost" size="icon" onClick={() => handlePDF(f, "print")} title="Imprimir">
import { traducirError } from "@/lib/errorTranslator";
                        <Printer className="h-4 w-4" />
import { traducirError } from "@/lib/errorTranslator";
                      </Button>
import { traducirError } from "@/lib/errorTranslator";
                      {f.clientes?.telefono && (
import { traducirError } from "@/lib/errorTranslator";
                        <Button variant="ghost" size="icon" title="Compartir WhatsApp/Email" onClick={() => handlePDF(f, "share")}>
import { traducirError } from "@/lib/errorTranslator";
                          <MessageCircle className="h-4 w-4 text-accent" />
import { traducirError } from "@/lib/errorTranslator";
                        </Button>
import { traducirError } from "@/lib/errorTranslator";
                      )}
import { traducirError } from "@/lib/errorTranslator";
                      {f.estado === "activa" && (
import { traducirError } from "@/lib/errorTranslator";
                        <Button variant="ghost" size="icon" title="Nota de Crédito"
import { traducirError } from "@/lib/errorTranslator";
                          onClick={() => setNcModal({
import { traducirError } from "@/lib/errorTranslator";
                            facturaId: f.id, numero: f.numero,
import { traducirError } from "@/lib/errorTranslator";
                            clienteId: f.cliente_id || "",
import { traducirError } from "@/lib/errorTranslator";
                            clienteNombre: f.clientes?.nombre || ""
import { traducirError } from "@/lib/errorTranslator";
                          })}
import { traducirError } from "@/lib/errorTranslator";
                        >
import { traducirError } from "@/lib/errorTranslator";
                          <RotateCcw className="h-4 w-4 text-warning" />
import { traducirError } from "@/lib/errorTranslator";
                        </Button>
import { traducirError } from "@/lib/errorTranslator";
                      )}
import { traducirError } from "@/lib/errorTranslator";
                      {f.estado === "activa" && (
import { traducirError } from "@/lib/errorTranslator";
                        <Button variant="ghost" size="icon" onClick={() => handleAnular(f.id)} title="Anular">
import { traducirError } from "@/lib/errorTranslator";
                          <Ban className="h-4 w-4 text-destructive" />
import { traducirError } from "@/lib/errorTranslator";
                        </Button>
import { traducirError } from "@/lib/errorTranslator";
                      )}
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

import { traducirError } from "@/lib/errorTranslator";
      {previewFactura && (
import { traducirError } from "@/lib/errorTranslator";
        <FacturaPreviewModal
import { traducirError } from "@/lib/errorTranslator";
          open={!!previewFactura}
import { traducirError } from "@/lib/errorTranslator";
          onOpenChange={o => { if (!o) setPreviewFactura(null); }}
import { traducirError } from "@/lib/errorTranslator";
          factura={previewFactura}
import { traducirError } from "@/lib/errorTranslator";
          negocio={negocio}
import { traducirError } from "@/lib/errorTranslator";
        />
import { traducirError } from "@/lib/errorTranslator";
      )}
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
      {ncModal && (
import { traducirError } from "@/lib/errorTranslator";
        <NotaCreditoModal
import { traducirError } from "@/lib/errorTranslator";
          open={!!ncModal}
import { traducirError } from "@/lib/errorTranslator";
          onOpenChange={o => { if (!o) setNcModal(null); }}
import { traducirError } from "@/lib/errorTranslator";
          facturaId={ncModal.facturaId}
import { traducirError } from "@/lib/errorTranslator";
          facturaNumero={ncModal.numero}
import { traducirError } from "@/lib/errorTranslator";
          clienteId={ncModal.clienteId}
import { traducirError } from "@/lib/errorTranslator";
          clienteNombre={ncModal.clienteNombre}
import { traducirError } from "@/lib/errorTranslator";
          onCreated={load}
import { traducirError } from "@/lib/errorTranslator";
        />
import { traducirError } from "@/lib/errorTranslator";
      )}
import { traducirError } from "@/lib/errorTranslator";
    </div>
import { traducirError } from "@/lib/errorTranslator";
  );
import { traducirError } from "@/lib/errorTranslator";
