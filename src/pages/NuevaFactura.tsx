import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Loader2, UserPlus, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { generateInvoicePDF, type NegocioData } from "@/lib/generateInvoicePDF";
import QuickClientModal from "@/components/QuickClientModal";

interface Cliente { id: string; nombre: string; rnc_cedula: string | null; }
interface Producto {
  id: string; nombre: string; precio: number; stock: number;
  itbis_aplicable: boolean; garantia_descripcion: string | null;
  condiciones_garantia: string | null; tipo: string;
}
interface LineaFactura {
  producto_id: string; nombre: string; cantidad: number;
  precio_unitario: number; itbis: number; subtotal: number;
  garantia: string | null; condiciones_garantia: string | null; tipo: string;
}

const ITBIS_RATE = 0.18;

const TIPOS_COMPROBANTE = [
  { value: "B01", label: "B01 – Crédito Fiscal", requiereRNC: true },
  { value: "B02", label: "B02 – Consumidor Final", requiereRNC: false },
  { value: "B14", label: "B14 – Gubernamental", requiereRNC: true },
  { value: "B15", label: "B15 – Regímenes Especiales", requiereRNC: true },
];

interface SecuenciaStatus {
  valido: boolean;
  error?: string;
  alerta?: string | null;
  porcentaje_uso?: number;
  restantes?: number;
}

export default function NuevaFactura() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [metodoPago, setMetodoPago] = useState<string>("efectivo");
  const [tipoComprobante, setTipoComprobante] = useState("B02");
  const [descuento, setDescuento] = useState("0");
  const [notas, setNotas] = useState("");
  const [lineas, setLineas] = useState<LineaFactura[]>([]);
  const [saving, setSaving] = useState(false);
  const [quickClientOpen, setQuickClientOpen] = useState(false);
  const [negocio, setNegocio] = useState<NegocioData | null>(null);
  const [formatoImpresion, setFormatoImpresion] = useState<"carta" | "80mm" | "58mm">("carta");
  const [secuenciaStatus, setSecuenciaStatus] = useState<SecuenciaStatus | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("clientes").select("id, nombre, rnc_cedula").order("nombre"),
      supabase.from("productos").select("id, nombre, precio, stock, itbis_aplicable, garantia_descripcion, condiciones_garantia, tipo").order("nombre"),
      supabase.from("configuracion_negocio")
        .select("nombre_comercial, razon_social, rnc, direccion, telefono, whatsapp, email, logo_url, mensaje_factura, formato_impresion")
        .maybeSingle(),
    ]).then(([c, p, neg]) => {
      setClientes(c.data || []);
      setProductos((p.data as any) || []);
      if (neg.data) {
        const d = neg.data as any;
        setNegocio({
          nombre_comercial: d.nombre_comercial, razon_social: d.razon_social,
          rnc: d.rnc, direccion: d.direccion, telefono: d.telefono,
          whatsapp: d.whatsapp, email: d.email, logo_url: d.logo_url,
          mensaje_factura: d.mensaje_factura,
        });
        if (d.formato_impresion) setFormatoImpresion(d.formato_impresion as any);
      }
    });
  }, [user]);

  // Validate sequence when tipo_comprobante changes
  useEffect(() => {
    if (!user) return;
    supabase.rpc("validar_secuencia_ncf" as any, { p_user_id: user.id, p_tipo: tipoComprobante })
      .then(({ data }: any) => {
        if (data) setSecuenciaStatus(data as SecuenciaStatus);
      });
  }, [user, tipoComprobante]);

  const selectedCliente = clientes.find(c => c.id === clienteId);
  const tipoConfig = TIPOS_COMPROBANTE.find(t => t.value === tipoComprobante);
  const requiereRNC = tipoConfig?.requiereRNC || false;
  const clienteSinRNC = requiereRNC && selectedCliente && !selectedCliente.rnc_cedula;

  // Validate RNC format: 9 digits (empresa) or 11 digits (persona)
  const validarRNC = (rnc: string | null | undefined): boolean => {
    if (!rnc) return false;
    const clean = rnc.replace(/[-\s]/g, "");
    return /^\d{9}$/.test(clean) || /^\d{11}$/.test(clean);
  };
  const rncInvalido = requiereRNC && selectedCliente?.rnc_cedula && !validarRNC(selectedCliente.rnc_cedula);

  const addLinea = (productoId: string) => {
    const prod = productos.find(p => p.id === productoId);
    if (!prod) return;
    if (lineas.find(l => l.producto_id === productoId)) { toast.error("Producto ya agregado"); return; }
    const itbis = prod.itbis_aplicable ? prod.precio * ITBIS_RATE : 0;
    setLineas([...lineas, {
      producto_id: productoId, nombre: prod.nombre, cantidad: 1,
      precio_unitario: Number(prod.precio), itbis, subtotal: Number(prod.precio) + itbis,
      garantia: prod.garantia_descripcion || null,
      condiciones_garantia: prod.condiciones_garantia || null,
      tipo: prod.tipo || "producto",
    }]);
  };

  const updateCantidad = (idx: number, cant: number) => {
    if (cant < 1) return;
    setLineas(lineas.map((l, i) => {
      if (i !== idx) return l;
      const prod = productos.find(p => p.id === l.producto_id);
      const itbisUnit = prod?.itbis_aplicable ? l.precio_unitario * ITBIS_RATE : 0;
      return { ...l, cantidad: cant, itbis: itbisUnit * cant, subtotal: (l.precio_unitario + itbisUnit) * cant };
    }));
  };

  const removeLinea = (idx: number) => setLineas(lineas.filter((_, i) => i !== idx));

  const subtotal = lineas.reduce((s, l) => s + l.precio_unitario * l.cantidad, 0);
  const totalItbis = lineas.reduce((s, l) => s + l.itbis, 0);
  const desc = parseFloat(descuento) || 0;
  const total = subtotal + totalItbis - desc;

  const handleSave = async (emitir: boolean) => {
    if (!clienteId) { toast.error("Selecciona un cliente"); return; }
    if (lineas.length === 0) { toast.error("Agrega al menos un producto"); return; }
    if (emitir && clienteSinRNC) {
      toast.error(`El comprobante ${tipoComprobante} requiere RNC/Cédula del cliente`);
      return;
    }
    if (emitir && rncInvalido) {
      toast.error(`El RNC/Cédula "${selectedCliente?.rnc_cedula}" no tiene formato válido (9 o 11 dígitos)`);
      return;
    }
    if (emitir && secuenciaStatus && !secuenciaStatus.valido) {
      toast.error(secuenciaStatus.error || "Secuencia no disponible");
      return;
    }

    setSaving(true);
    try {
      let ncf: string | null = null;
      const estado = emitir ? "emitida" : "borrador";

      if (emitir) {
        const { data: ncfData, error: ncfError } = await supabase.rpc("next_ncf" as any, {
          p_user_id: user!.id, p_tipo: tipoComprobante
        });
        if (ncfError) throw ncfError;
        ncf = ncfData as string;
      }

      const { data: seqData, error: seqErr } = await supabase.rpc("next_invoice_number" as any, {
        p_user_id: user!.id,
      });
      if (seqErr) throw seqErr;
      const numero = seqData as string;

      const { data: factura, error: facError } = await supabase.from("facturas").insert({
        numero, cliente_id: clienteId, subtotal, itbis: totalItbis,
        descuento: desc, total, metodo_pago: metodoPago as any,
        notas: notas || null, user_id: user!.id,
        tipo_comprobante: tipoComprobante, ncf: ncf || "",
        estado: estado as any,
      }).select().single();

      if (facError) throw facError;

      const detalles = lineas.map(l => ({
        factura_id: factura.id, producto_id: l.producto_id,
        cantidad: l.cantidad, precio_unitario: l.precio_unitario,
        itbis: l.itbis, subtotal: l.subtotal,
      }));

      const { error: detError } = await supabase.from("detalle_facturas").insert(detalles);
      if (detError) throw detError;

      // Only decrement stock for products when emitting
      if (emitir) {
        for (const l of lineas) {
          if (l.tipo !== "servicio") {
            await supabase.rpc("decrement_stock" as any, { p_id: l.producto_id, amount: l.cantidad });
          }
        }
      }

      await supabase.from("audit_logs").insert({
        user_id: user!.id,
        accion: emitir ? "emitir_factura" : "crear_borrador",
        entidad: "facturas", entidad_id: factura.id,
        detalles: { numero, total, ncf, tipo_comprobante: tipoComprobante, estado }
      } as any);

      if (emitir) {
        const cliente = clientes.find(c => c.id === clienteId);
        generateInvoicePDF({
          numero, fecha: new Date().toISOString(),
          cliente: { nombre: cliente?.nombre || "", rnc_cedula: cliente?.rnc_cedula },
          detalles: lineas.map(l => ({
            nombre: l.nombre, cantidad: l.cantidad,
            precio_unitario: l.precio_unitario, itbis: l.itbis,
            subtotal: l.subtotal, garantia: l.garantia,
            condiciones_garantia: l.condiciones_garantia,
          })),
          subtotal, itbis: totalItbis, descuento: desc, total,
          metodo_pago: metodoPago, notas,
          ncf: ncf || undefined,
          tipo_comprobante: tipoComprobante,
          negocio: negocio || undefined, formato: formatoImpresion,
        });
      }

      toast.success(emitir
        ? `Factura ${numero} emitida con NCF ${ncf}`
        : `Borrador ${numero} guardado`
      );
      navigate("/facturas");
    } catch (err: any) {
      toast.error(err.message || "Error al crear factura");
    }
    setSaving(false);
  };

  const handleClientCreated = (c: { id: string; nombre: string; rnc_cedula: string | null }) => {
    setClientes(prev => [...prev, c].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setClienteId(c.id);
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nueva Factura</h1>
        <p className="text-muted-foreground">Genera una nueva factura con valor fiscal</p>
      </div>

      {/* Sequence alerts */}
      {secuenciaStatus && !secuenciaStatus.valido && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{secuenciaStatus.error}</AlertDescription>
        </Alert>
      )}
      {secuenciaStatus?.alerta === "proxima_agotar" && (
        <Alert>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            ⚠️ Secuencia {tipoComprobante} al {secuenciaStatus.porcentaje_uso}% de uso. Quedan {secuenciaStatus.restantes} comprobantes.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Datos de la Factura</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Tipo de Comprobante */}
            <div className="space-y-2">
              <Label>Tipo de Comprobante Fiscal *</Label>
              <Select value={tipoComprobante} onValueChange={setTipoComprobante}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_COMPROBANTE.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {tipoConfig?.requiereRNC ? "🔒 Requiere RNC" : "✅ Sin RNC requerido"}
                </Badge>
                {secuenciaStatus?.valido && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {secuenciaStatus.restantes} disponibles
                  </Badge>
                )}
              </div>
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <div className="flex gap-2">
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} {c.rnc_cedula ? `(${c.rnc_cedula})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => setQuickClientOpen(true)} title="Crear cliente rápido">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
              {clienteSinRNC && (
                <p className="text-xs text-destructive font-medium">
                  ⚠️ Este cliente no tiene RNC/Cédula. Es obligatorio para {tipoComprobante}.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Formato de Impresión</Label>
              <div className="flex gap-2">
                {(["carta", "80mm", "58mm"] as const).map(fmt => (
                  <Button key={fmt} type="button" variant={formatoImpresion === fmt ? "default" : "outline"}
                    size="sm" onClick={() => setFormatoImpresion(fmt)}>
                    {fmt === "carta" ? "📄 Carta" : `🧾 ${fmt}`}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descuento (RD$)</Label>
              <Input type="number" step="0.01" value={descuento} onChange={e => setDescuento(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Resumen</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {negocio?.nombre_comercial && (
              <div className="rounded-lg bg-muted/40 p-2.5 mb-2 border border-border">
                <p className="text-xs font-semibold text-foreground">{negocio.nombre_comercial}</p>
                {negocio.rnc && <p className="text-xs text-muted-foreground">RNC: {negocio.rnc}</p>}
                {negocio.direccion && <p className="text-xs text-muted-foreground">{negocio.direccion}</p>}
              </div>
            )}
            <div className="rounded-lg bg-primary/5 p-2.5 border border-primary/20">
              <p className="text-xs font-semibold text-primary">📋 {tipoConfig?.label}</p>
              <p className="text-xs text-muted-foreground">Factura con valor fiscal</p>
            </div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>RD$ {subtotal.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">ITBIS (18%)</span><span>RD$ {totalItbis.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Descuento</span><span>-RD$ {desc.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</span></div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>RD$ {total.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <Button onClick={() => handleSave(true)} className="w-full" disabled={saving || (secuenciaStatus !== null && !secuenciaStatus.valido)}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Emitir Factura (con NCF)
              </Button>
              <Button onClick={() => handleSave(false)} variant="outline" className="w-full" disabled={saving}>
                Guardar como Borrador
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Productos</CardTitle>
            <Select onValueChange={addLinea}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Agregar producto..." /></SelectTrigger>
              <SelectContent>
                {productos.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} — RD$ {Number(p.precio).toLocaleString("es-DO", { minimumFractionDigits: 2 })} (Stock: {p.stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="w-24">Cantidad</TableHead>
                <TableHead>Precio Unit.</TableHead>
                <TableHead>ITBIS</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <Plus className="h-6 w-6 mx-auto mb-1 opacity-50" />
                    Agrega productos a la factura
                  </TableCell>
                </TableRow>
              ) : lineas.map((l, i) => (
                <TableRow key={l.producto_id}>
                  <TableCell className="font-medium">
                    <div>{l.nombre}</div>
                    {l.garantia && (
                      <div className="text-xs text-primary mt-0.5 flex items-center gap-1">🛡️ Garantía: {l.garantia}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input type="number" min={1} value={l.cantidad} onChange={e => updateCantidad(i, parseInt(e.target.value) || 1)} className="w-20" />
                  </TableCell>
                  <TableCell>RD$ {l.precio_unitario.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>RD$ {l.itbis.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="font-medium">RD$ {l.subtotal.toLocaleString("es-DO", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeLinea(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <QuickClientModal open={quickClientOpen} onOpenChange={setQuickClientOpen} onCreated={handleClientCreated} />
    </div>
  );
}
