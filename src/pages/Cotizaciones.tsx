import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Send, CheckCircle, XCircle, ArrowRight, Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GuiaUso from "@/components/GuiaUso";
import { exportToExcel } from "@/lib/exportUtils";

const ITBIS_RATE = 0.18;

interface Cotizacion {
  id: string; numero: string; fecha: string; fecha_vencimiento: string | null;
  cliente_id: string; subtotal: number; itbis: number; descuento: number; total: number;
  estado: string; notas: string | null; terminos: string | null;
  factura_id: string | null;
  clientes: { nombre: string; rnc_cedula: string | null } | null;
}
interface Cliente { id: string; nombre: string; rnc_cedula: string | null; }
interface Producto { id: string; nombre: string; precio: number; itbis_aplicable: boolean; }
interface Linea {
  producto_id: string | null; descripcion: string; cantidad: number;
  precio_unitario: number; itbis: number; subtotal: number;
}

const ESTADO_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  borrador: { label: "Borrador", variant: "outline" },
  enviada: { label: "Enviada", variant: "secondary" },
  aprobada: { label: "Aprobada", variant: "default" },
  rechazada: { label: "Rechazada", variant: "destructive" },
  vencida: { label: "Vencida", variant: "destructive" },
  convertida: { label: "Convertida", variant: "default" },
};

export default function Cotizaciones() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cots, setCots] = useState<Cotizacion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todas");

  // Modal editor
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [clienteId, setClienteId] = useState("");
  const [fechaVenc, setFechaVenc] = useState("");
  const [descuento, setDescuento] = useState("0");
  const [notas, setNotas] = useState("");
  const [terminos, setTerminos] = useState("Precios en RD$. Cotización válida por 15 días.");
  const [lineas, setLineas] = useState<Linea[]>([]);

  const load = async () => {
    const [cRes, cliRes, prodRes] = await Promise.all([
      supabase.from("cotizaciones").select("*, clientes(nombre, rnc_cedula)").order("created_at", { ascending: false }),
      supabase.from("clientes").select("id, nombre, rnc_cedula").order("nombre"),
      supabase.from("productos").select("id, nombre, precio, itbis_aplicable").order("nombre"),
    ]);
    setCots((cRes.data as any) || []);
    setClientes((cliRes.data as any) || []);
    setProductos((prodRes.data as any) || []);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const resetForm = () => {
    setEditId(null); setClienteId(""); setFechaVenc(""); setDescuento("0");
    setNotas(""); setTerminos("Precios en RD$. Cotización válida por 15 días.");
    setLineas([]);
  };

  const openNew = () => { resetForm(); setOpen(true); };

  const openEdit = async (c: Cotizacion) => {
    if (c.estado === "convertida") { toast.error("Esta cotización ya fue convertida en factura"); return; }
    setEditId(c.id);
    setClienteId(c.cliente_id);
    setFechaVenc(c.fecha_vencimiento || "");
    setDescuento(String(c.descuento));
    setNotas(c.notas || "");
    setTerminos(c.terminos || "");
    const { data } = await supabase.from("detalle_cotizaciones").select("*").eq("cotizacion_id", c.id);
    setLineas(((data as any) || []).map((d: any) => ({
      producto_id: d.producto_id, descripcion: d.descripcion,
      cantidad: Number(d.cantidad), precio_unitario: Number(d.precio_unitario),
      itbis: Number(d.itbis), subtotal: Number(d.subtotal),
    })));
    setOpen(true);
  };

  const addProducto = (id: string) => {
    const p = productos.find(x => x.id === id);
    if (!p) return;
    const itbisUnit = p.itbis_aplicable ? Number(p.precio) * ITBIS_RATE : 0;
    setLineas([...lineas, {
      producto_id: p.id, descripcion: p.nombre, cantidad: 1,
      precio_unitario: Number(p.precio), itbis: itbisUnit,
      subtotal: Number(p.precio) + itbisUnit,
    }]);
  };
  const addLibre = () => setLineas([...lineas, { producto_id: null, descripcion: "", cantidad: 1, precio_unitario: 0, itbis: 0, subtotal: 0 }]);
  const updLinea = (i: number, patch: Partial<Linea>) => {
    setLineas(lineas.map((l, idx) => {
      if (idx !== i) return l;
      const merged = { ...l, ...patch } as Linea;
      const hasItbis = productos.find(p => p.id === merged.producto_id)?.itbis_aplicable ?? (merged.itbis > 0 || l.itbis > 0);
      const itbisUnit = hasItbis ? merged.precio_unitario * ITBIS_RATE : 0;
      merged.itbis = itbisUnit * merged.cantidad;
      merged.subtotal = (merged.precio_unitario + itbisUnit) * merged.cantidad;
      return merged;
    }));
  };
  const removeLinea = (i: number) => setLineas(lineas.filter((_, idx) => idx !== i));

  const subtotal = lineas.reduce((s, l) => s + l.precio_unitario * l.cantidad, 0);
  const totalItbis = lineas.reduce((s, l) => s + l.itbis, 0);
  const desc = parseFloat(descuento) || 0;
  const total = subtotal + totalItbis - desc;

  const save = async () => {
    if (!clienteId) { toast.error("Selecciona un cliente"); return; }
    if (lineas.length === 0) { toast.error("Agrega al menos una línea"); return; }
    if (lineas.some(l => !l.descripcion.trim())) { toast.error("Todas las líneas requieren descripción"); return; }
    setSaving(true);
    try {
      let cotId = editId;
      const payload = {
        cliente_id: clienteId,
        fecha_vencimiento: fechaVenc || null,
        subtotal, itbis: totalItbis, descuento: desc, total,
        notas: notas || null, terminos: terminos || null,
      };
      if (editId) {
        const { error } = await supabase.from("cotizaciones").update(payload).eq("id", editId);
        if (error) throw error;
        await supabase.from("detalle_cotizaciones").delete().eq("cotizacion_id", editId);
      } else {
        const { data: num, error: nErr } = await supabase.rpc("next_quote_number" as any, { p_user_id: user!.id });
        if (nErr) throw nErr;
        const { data, error } = await supabase.from("cotizaciones").insert({
          ...payload, numero: num as string, user_id: user!.id, estado: "borrador",
        }).select().single();
        if (error) throw error;
        cotId = data.id;
      }
      const detalles = lineas.map(l => ({
        cotizacion_id: cotId!, producto_id: l.producto_id, descripcion: l.descripcion,
        cantidad: l.cantidad, precio_unitario: l.precio_unitario, itbis: l.itbis, subtotal: l.subtotal,
      }));
      const { error: dErr } = await supabase.from("detalle_cotizaciones").insert(detalles);
      if (dErr) throw dErr;
      toast.success(editId ? "Cotización actualizada" : "Cotización creada");
      setOpen(false); resetForm(); load();
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    }
    setSaving(false);
  };

  const cambiarEstado = async (c: Cotizacion, estado: string) => {
    const { error } = await supabase.from("cotizaciones").update({ estado }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(`Cotización ${ESTADO_CONFIG[estado]?.label?.toLowerCase()}`);
    load();
  };

  const eliminar = async (c: Cotizacion) => {
    if (c.estado === "convertida") { toast.error("No se puede eliminar una cotización convertida"); return; }
    if (!confirm(`¿Eliminar cotización ${c.numero}?`)) return;
    const { error } = await supabase.from("cotizaciones").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Cotización eliminada"); load();
  };

  const convertirAFactura = async (c: Cotizacion) => {
    if (c.estado !== "aprobada") { toast.error("Solo cotizaciones aprobadas pueden convertirse"); return; }
    if (!confirm(`Convertir ${c.numero} en factura (borrador)?`)) return;
    try {
      const { data: det, error: dErr } = await supabase.from("detalle_cotizaciones")
        .select("*").eq("cotizacion_id", c.id);
      if (dErr) throw dErr;
      const conProd = ((det as any) || []).filter((d: any) => d.producto_id);
      if (conProd.length === 0) { toast.error("La cotización no tiene productos vinculados; edita las líneas antes de convertir"); return; }
      if (conProd.length !== (det as any).length) {
        toast.error("Todas las líneas deben tener un producto vinculado para facturar"); return;
      }
      const { data: numero, error: nErr } = await supabase.rpc("next_invoice_number" as any, { p_user_id: user!.id });
      if (nErr) throw nErr;
      const { data: factura, error: fErr } = await supabase.from("facturas").insert({
        numero: numero as string, cliente_id: c.cliente_id,
        subtotal: c.subtotal, itbis: c.itbis, descuento: c.descuento, total: c.total,
        metodo_pago: "efectivo" as any, estado: "borrador" as any,
        notas: c.notas ? `Desde cotización ${c.numero}. ${c.notas}` : `Desde cotización ${c.numero}`,
        user_id: user!.id, tipo_comprobante: "B02", ncf: "",
      }).select().single();
      if (fErr) throw fErr;
      const detFact = (det as any).map((d: any) => ({
        factura_id: factura.id, producto_id: d.producto_id,
        cantidad: d.cantidad, precio_unitario: d.precio_unitario,
        itbis: d.itbis, subtotal: d.subtotal,
      }));
      const { error: dfErr } = await supabase.from("detalle_facturas").insert(detFact);
      if (dfErr) throw dfErr;
      await supabase.from("cotizaciones").update({
        estado: "convertida", factura_id: factura.id, fecha_conversion: new Date().toISOString(),
      }).eq("id", c.id);
      toast.success(`Convertida a factura ${numero} (borrador). Revísala y emítela con NCF.`);
      navigate("/facturas");
    } catch (e: any) {
      toast.error(e.message || "Error al convertir");
    }
  };

  const filtered = cots.filter(c => {
    const s = search.toLowerCase();
    const ms = !s || c.numero.toLowerCase().includes(s) || (c.clientes?.nombre || "").toLowerCase().includes(s);
    const me = estadoFiltro === "todas" || c.estado === estadoFiltro;
    return ms && me;
  });

  const handleExport = () => {
    exportToExcel(filtered.map(c => ({
      Número: c.numero, Cliente: c.clientes?.nombre || "",
      Fecha: new Date(c.fecha).toLocaleDateString("es-DO"),
      Vencimiento: c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString("es-DO") : "",
      Subtotal: Number(c.subtotal), ITBIS: Number(c.itbis),
      Descuento: Number(c.descuento), Total: Number(c.total), Estado: c.estado,
    })), "cotizaciones");
    toast.success("Exportado a Excel");
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cotizaciones</h1>
          <p className="text-muted-foreground">Propuestas comerciales convertibles a factura con un clic</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>Exportar</Button>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nueva Cotización</Button>
        </div>
      </div>

      <GuiaUso
        storageKey="cotizaciones"
        titulo="Flujo de cotización"
        pasos={[
          { titulo: "Crea la cotización", descripcion: "Selecciona el cliente y agrega productos o líneas libres. Se guarda como borrador." },
          { titulo: "Envíala al cliente", descripcion: "Cambia el estado a 'Enviada' cuando la remitas por correo o WhatsApp." },
          { titulo: "Aprueba o rechaza", descripcion: "Marca 'Aprobada' cuando el cliente confirme; 'Rechazada' si no procede." },
          { titulo: "Convierte en factura", descripcion: "Un clic en el botón → se crea una factura borrador con los mismos ítems, lista para emitir con NCF." },
        ]}
        tip="Las cotizaciones NO consumen NCF ni afectan inventario. Solo la factura resultante lo hace al emitirse."
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por número o cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="enviada">Enviada</SelectItem>
            <SelectItem value="aprobada">Aprobada</SelectItem>
            <SelectItem value="rechazada">Rechazada</SelectItem>
            <SelectItem value="vencida">Vencida</SelectItem>
            <SelectItem value="convertida">Convertida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-56 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />No hay cotizaciones
                  </TableCell>
                </TableRow>
              ) : filtered.map(c => {
                const ec = ESTADO_CONFIG[c.estado] || { label: c.estado, variant: "outline" as const };
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-medium cursor-pointer" onClick={() => openEdit(c)}>{c.numero}</TableCell>
                    <TableCell>{c.clientes?.nombre || "—"}</TableCell>
                    <TableCell>{new Date(c.fecha).toLocaleDateString("es-DO")}</TableCell>
                    <TableCell>{c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString("es-DO") : "—"}</TableCell>
                    <TableCell className="font-medium">RD$ {Number(c.total).toLocaleString("es-DO", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell><Badge variant={ec.variant}>{ec.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {c.estado === "borrador" && (
                          <Button variant="ghost" size="icon" onClick={() => cambiarEstado(c, "enviada")} title="Marcar enviada">
                            <Send className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        {c.estado === "enviada" && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => cambiarEstado(c, "aprobada")} title="Aprobar">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => cambiarEstado(c, "rechazada")} title="Rechazar">
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        {c.estado === "aprobada" && (
                          <Button variant="ghost" size="sm" onClick={() => convertirAFactura(c)} title="Convertir a factura">
                            <ArrowRight className="h-4 w-4 mr-1" />Facturar
                          </Button>
                        )}
                        {c.estado === "convertida" && c.factura_id && (
                          <Button variant="ghost" size="sm" onClick={() => navigate("/facturas")}>
                            Ver factura
                          </Button>
                        )}
                        {c.estado !== "convertida" && (
                          <Button variant="ghost" size="icon" onClick={() => eliminar(c)} title="Eliminar">
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar cotización" : "Nueva cotización"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}{c.rnc_cedula ? ` (${c.rnc_cedula})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vence</Label>
              <Input type="date" value={fechaVenc} onChange={e => setFechaVenc(e.target.value)} />
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Líneas</CardTitle>
                <div className="flex gap-2">
                  <Select onValueChange={addProducto}>
                    <SelectTrigger className="w-[220px] h-9"><SelectValue placeholder="+ Agregar producto" /></SelectTrigger>
                    <SelectContent>
                      {productos.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre} — RD$ {Number(p.precio).toFixed(2)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={addLibre}><Plus className="h-4 w-4 mr-1" />Línea libre</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="w-24">Cant.</TableHead>
                    <TableHead className="w-32">Precio</TableHead>
                    <TableHead className="w-32">Subtotal</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineas.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Sin líneas</TableCell></TableRow>
                  ) : lineas.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input value={l.descripcion} onChange={e => updLinea(i, { descripcion: e.target.value })} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" min={1} value={l.cantidad} onChange={e => updLinea(i, { cantidad: Number(e.target.value) || 1 })} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" step="0.01" value={l.precio_unitario} onChange={e => updLinea(i, { precio_unitario: Number(e.target.value) || 0 })} />
                      </TableCell>
                      <TableCell className="font-medium">RD$ {l.subtotal.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeLinea(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Descuento (RD$)</Label>
              <Input type="number" step="0.01" value={descuento} onChange={e => setDescuento(e.target.value)} />
              <Label className="mt-4">Notas</Label>
              <Textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} />
              <Label className="mt-2">Términos y condiciones</Label>
              <Textarea value={terminos} onChange={e => setTerminos(e.target.value)} rows={2} />
            </div>
            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>RD$ {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">ITBIS (18%)</span><span>RD$ {totalItbis.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Descuento</span><span>-RD$ {desc.toFixed(2)}</span></div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg"><span>Total</span><span>RD$ {total.toFixed(2)}</span></div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editId ? "Guardar cambios" : "Crear cotización"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}