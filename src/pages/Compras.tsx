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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, ShoppingCart, Loader2, Download } from "lucide-react";
import { exportToExcel } from "@/lib/exportUtils";

interface Proveedor { id: string; nombre: string; rnc?: string | null; }
interface Producto { id: string; nombre: string; costo: number; }
interface LineaCompra { producto_id: string; nombre: string; cantidad: number; precio_unitario: number; subtotal: number; }
interface Compra { id: string; fecha: string; total: number; notas: string | null; ncf: string | null; itbis_facturado: number | null; proveedores: { nombre: string; rnc?: string | null } | null; }

const TIPO_BIENES_SERVICIOS = [
  { code: "01", label: "01 · Gastos de personal" },
  { code: "02", label: "02 · Gastos por trabajos, suministros y servicios" },
  { code: "03", label: "03 · Arrendamientos" },
  { code: "04", label: "04 · Gastos de activos fijos" },
  { code: "05", label: "05 · Gastos de representación" },
  { code: "06", label: "06 · Gastos financieros" },
  { code: "07", label: "07 · Gastos de seguros" },
  { code: "08", label: "08 · Gastos de combustible" },
  { code: "09", label: "09 · Compras y gastos que formarán parte del costo de venta" },
  { code: "10", label: "10 · Adquisiciones de activos" },
  { code: "11", label: "11 · Gastos de arrendamientos" },
];

const FORMAS_PAGO = [
  { code: "1", label: "1 · Efectivo" },
  { code: "2", label: "2 · Cheques / Transferencia / Depósito" },
  { code: "3", label: "3 · Tarjeta crédito/débito" },
  { code: "4", label: "4 · Compra a crédito" },
  { code: "5", label: "5 · Permuta" },
  { code: "6", label: "6 · Nota de crédito" },
  { code: "7", label: "7 · Mixto" },
];

const TIPOS_RETENCION_ISR = [
  { code: "", label: "— Sin retención ISR —" },
  { code: "01", label: "01 · Alquileres" },
  { code: "02", label: "02 · Honorarios por servicios" },
  { code: "03", label: "03 · Otras rentas" },
  { code: "04", label: "04 · Rentas presuntas" },
  { code: "05", label: "05 · Intereses pagados a personas jurídicas" },
  { code: "06", label: "06 · Intereses pagados a personas físicas" },
  { code: "07", label: "07 · Retención por proveedores del Estado" },
  { code: "08", label: "08 · Juegos telefónicos" },
];

export default function Compras() {
  const { user } = useAuth();
  const [compras, setCompras] = useState<Compra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [open, setOpen] = useState(false);
  const [proveedorId, setProveedorId] = useState("");
  const [notas, setNotas] = useState("");
  const [lineas, setLineas] = useState<LineaCompra[]>([]);
  // Campos 606 (norma 07-2018)
  const [ncf, setNcf] = useState("");
  const [ncfModificado, setNcfModificado] = useState("");
  const [tipoBS, setTipoBS] = useState("09");
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [fechaPago, setFechaPago] = useState<string>("");
  const [montoServicios, setMontoServicios] = useState("0");
  const [montoBienesManual, setMontoBienesManual] = useState<string>("");
  const [itbisFacturado, setItbisFacturado] = useState("0");
  const [itbisRetenido, setItbisRetenido] = useState("0");
  const [itbisProp, setItbisProp] = useState("0");
  const [itbisCosto, setItbisCosto] = useState("0");
  const [itbisPercibido, setItbisPercibido] = useState("0");
  const [tipoRetIsr, setTipoRetIsr] = useState("");
  const [montoRetIsr, setMontoRetIsr] = useState("0");
  const [isrPercibido, setIsrPercibido] = useState("0");
  const [isc, setIsc] = useState("0");
  const [otrosImp, setOtrosImp] = useState("0");
  const [propinaLegal, setPropinaLegal] = useState("0");
  const [formaPago, setFormaPago] = useState("1");
  const [saving, setSaving] = useState(false);

  const loadCompras = async () => {
    const { data } = await supabase
      .from("compras")
      .select("*, proveedores(nombre, rnc)")
      .order("created_at", { ascending: false });
    setCompras((data as any) || []);
  };

  useEffect(() => {
    if (!user) return;
    Promise.all([
      loadCompras(),
      supabase.from("proveedores").select("id, nombre, rnc").order("nombre").then(r => setProveedores(r.data || [])),
      supabase.from("productos").select("id, nombre, costo").order("nombre").then(r => setProductos(r.data || [])),
    ]);
  }, [user]);

  const resetForm = () => {
    setProveedorId(""); setNotas(""); setLineas([]);
    setNcf(""); setNcfModificado(""); setTipoBS("09");
    setFecha(new Date().toISOString().slice(0, 10)); setFechaPago("");
    setMontoServicios("0"); setMontoBienesManual("");
    setItbisFacturado("0"); setItbisRetenido("0"); setItbisProp("0");
    setItbisCosto("0"); setItbisPercibido("0");
    setTipoRetIsr(""); setMontoRetIsr("0"); setIsrPercibido("0");
    setIsc("0"); setOtrosImp("0"); setPropinaLegal("0");
    setFormaPago("1");
  };

  const addLinea = (productoId: string) => {
    const prod = productos.find(p => p.id === productoId);
    if (!prod) return;
    if (lineas.find(l => l.producto_id === productoId)) { toast.error("Producto ya agregado"); return; }
    setLineas([...lineas, {
      producto_id: productoId,
      nombre: prod.nombre,
      cantidad: 1,
      precio_unitario: Number(prod.costo),
      subtotal: Number(prod.costo),
    }]);
  };

  const updateLinea = (idx: number, field: "cantidad" | "precio_unitario", value: number) => {
    setLineas(lineas.map((l, i) => {
      if (i !== idx) return l;
      const updated = { ...l, [field]: value };
      updated.subtotal = updated.cantidad * updated.precio_unitario;
      return updated;
    }));
  };

  const removeLinea = (idx: number) => setLineas(lineas.filter((_, i) => i !== idx));
  const n = (v: string) => Number(v || 0) || 0;
  const lineasSubtotal = lineas.reduce((s, l) => s + l.subtotal, 0);
  const montoBienes = montoBienesManual === "" ? lineasSubtotal : n(montoBienesManual);
  const base = montoBienes + n(montoServicios);
  const total = base + n(itbisFacturado) + n(isc) + n(otrosImp) + n(propinaLegal);

  const handleSave = async () => {
    if (!proveedorId) { toast.error("Selecciona un proveedor"); return; }
    if (base <= 0) { toast.error("Ingresa monto de bienes o servicios"); return; }
    if (!ncf) { toast.error("El NCF del proveedor es obligatorio para el 606"); return; }

    setSaving(true);
    try {
      const { data: compra, error: compraError } = await supabase.from("compras").insert({
        proveedor_id: proveedorId,
        total,
        notas: notas || null,
        user_id: user!.id,
        fecha: new Date(fecha).toISOString(),
        fecha_pago: fechaPago || null,
        ncf,
        ncf_modificado: ncfModificado || null,
        tipo_bienes_servicios: tipoBS,
        monto_servicios: n(montoServicios),
        monto_bienes: montoBienes,
        itbis_facturado: n(itbisFacturado),
        itbis_retenido: n(itbisRetenido),
        itbis_proporcionalidad: n(itbisProp),
        itbis_costo: n(itbisCosto),
        itbis_percibido: n(itbisPercibido),
        tipo_retencion_isr: tipoRetIsr || null,
        monto_retencion_isr: n(montoRetIsr),
        isr_percibido: n(isrPercibido),
        isc: n(isc),
        otros_impuestos: n(otrosImp),
        propina_legal: n(propinaLegal),
        forma_pago: formaPago,
      } as any).select().single();
      if (compraError) throw compraError;

      if (lineas.length > 0) {
        const detalles = lineas.map(l => ({
          compra_id: compra.id,
          producto_id: l.producto_id,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          subtotal: l.subtotal,
        }));
        const { error: detError } = await supabase.from("detalle_compras").insert(detalles);
        if (detError) throw detError;

        for (const l of lineas) {
          const { data: prod } = await supabase.from("productos").select("stock").eq("id", l.producto_id).single();
          if (prod) {
            await supabase.from("productos").update({ stock: prod.stock + l.cantidad }).eq("id", l.producto_id);
          }
        }
      }

      await supabase.from("audit_logs").insert({
        user_id: user!.id,
        accion: "registrar_compra",
        entidad: "compras",
        entidad_id: compra.id,
        detalles: { proveedor_id: proveedorId, total, ncf, tipoBS, formaPago }
      } as any);

      toast.success("Compra registrada · lista para 606");
      setOpen(false);
      resetForm();
      loadCompras();
    } catch (err: any) {
      toast.error(err.message || "Error al registrar compra");
    }
    setSaving(false);
  };

  const handleExport = () => {
    exportToExcel(compras.map(c => ({
      Fecha: new Date(c.fecha).toLocaleDateString("es-DO"),
      Proveedor: c.proveedores?.nombre || "",
      RNC: c.proveedores?.rnc || "",
      NCF: c.ncf || "",
      ITBIS: Number(c.itbis_facturado || 0),
      Total: Number(c.total),
      Notas: c.notas || "",
    })), "compras");
    toast.success("Exportado");
  };

  const fmt = (n: number) => `RD$ ${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compras</h1>
          <p className="text-muted-foreground">{compras.length} compras registradas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Exportar</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nueva Compra</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Registrar Compra (606)</DialogTitle></DialogHeader>
              <Tabs defaultValue="ident" className="space-y-3">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="ident">Identificación</TabsTrigger>
                  <TabsTrigger value="montos">Montos</TabsTrigger>
                  <TabsTrigger value="retenciones">Retenciones</TabsTrigger>
                  <TabsTrigger value="pago">Pago y productos</TabsTrigger>
                </TabsList>

                <TabsContent value="ident" className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                      <Label>Proveedor *</Label>
                      <Select value={proveedorId} onValueChange={setProveedorId}>
                        <SelectTrigger><SelectValue placeholder="Selecciona proveedor" /></SelectTrigger>
                        <SelectContent>
                          {proveedores.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}{p.rnc ? ` — ${p.rnc}` : ""}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>NCF del proveedor *</Label>
                      <Input value={ncf} onChange={e => setNcf(e.target.value.toUpperCase())} placeholder="B01…" className="font-mono" />
                    </div>
                    <div className="space-y-1">
                      <Label>NCF modificado (si aplica)</Label>
                      <Input value={ncfModificado} onChange={e => setNcfModificado(e.target.value.toUpperCase())} className="font-mono" />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label>Tipo de bienes / servicios *</Label>
                      <Select value={tipoBS} onValueChange={setTipoBS}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIPO_BIENES_SERVICIOS.map(t => <SelectItem key={t.code} value={t.code}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Fecha comprobante *</Label>
                      <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Fecha de pago</Label>
                      <Input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="montos" className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Monto servicios</Label>
                      <Input type="number" step="0.01" value={montoServicios} onChange={e => setMontoServicios(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Monto bienes {lineas.length > 0 && montoBienesManual === "" && <span className="text-xs text-muted-foreground">(auto)</span>}</Label>
                      <Input type="number" step="0.01" value={montoBienesManual === "" ? String(lineasSubtotal) : montoBienesManual} onChange={e => setMontoBienesManual(e.target.value)} placeholder={lineas.length > 0 ? "Se calcula de productos" : "0.00"} />
                    </div>
                    <div className="space-y-1">
                      <Label>ITBIS facturado (18%)</Label>
                      <Input type="number" step="0.01" value={itbisFacturado} onChange={e => setItbisFacturado(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>ISC</Label>
                      <Input type="number" step="0.01" value={isc} onChange={e => setIsc(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Otros impuestos</Label>
                      <Input type="number" step="0.01" value={otrosImp} onChange={e => setOtrosImp(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Propina legal (10%)</Label>
                      <Input type="number" step="0.01" value={propinaLegal} onChange={e => setPropinaLegal(e.target.value)} />
                    </div>
                  </div>
                  <div className="rounded-md bg-muted/40 p-3 text-sm flex justify-between">
                    <span>Base gravable:</span> <strong>{fmt(base)}</strong>
                  </div>
                </TabsContent>

                <TabsContent value="retenciones" className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>ITBIS retenido</Label>
                      <Input type="number" step="0.01" value={itbisRetenido} onChange={e => setItbisRetenido(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>ITBIS por proporcionalidad</Label>
                      <Input type="number" step="0.01" value={itbisProp} onChange={e => setItbisProp(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>ITBIS llevado al costo</Label>
                      <Input type="number" step="0.01" value={itbisCosto} onChange={e => setItbisCosto(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>ITBIS percibido</Label>
                      <Input type="number" step="0.01" value={itbisPercibido} onChange={e => setItbisPercibido(e.target.value)} />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label>Tipo retención ISR</Label>
                      <Select value={tipoRetIsr || "__none"} onValueChange={v => setTipoRetIsr(v === "__none" ? "" : v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIPOS_RETENCION_ISR.map(t => <SelectItem key={t.code || "__none"} value={t.code || "__none"}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Monto retención ISR</Label>
                      <Input type="number" step="0.01" value={montoRetIsr} onChange={e => setMontoRetIsr(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>ISR percibido</Label>
                      <Input type="number" step="0.01" value={isrPercibido} onChange={e => setIsrPercibido(e.target.value)} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pago" className="space-y-3">
                  <div className="space-y-1">
                    <Label>Forma de pago *</Label>
                    <Select value={formaPago} onValueChange={setFormaPago}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FORMAS_PAGO.map(f => <SelectItem key={f.code} value={f.code}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Agregar producto al inventario (opcional)</Label>
                    <Select onValueChange={addLinea}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar producto..." /></SelectTrigger>
                      <SelectContent>
                        {productos.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nombre} — Costo: {fmt(Number(p.costo))}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {lineas.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="w-20">Cant.</TableHead>
                          <TableHead className="w-28">Precio</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineas.map((l, i) => (
                          <TableRow key={l.producto_id}>
                            <TableCell className="font-medium">{l.nombre}</TableCell>
                            <TableCell>
                              <Input type="number" min={1} value={l.cantidad} onChange={e => updateLinea(i, "cantidad", parseInt(e.target.value) || 1)} className="w-16" />
                            </TableCell>
                            <TableCell>
                              <Input type="number" step="0.01" value={l.precio_unitario} onChange={e => updateLinea(i, "precio_unitario", parseFloat(e.target.value) || 0)} className="w-24" />
                            </TableCell>
                            <TableCell>{fmt(l.subtotal)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => removeLinea(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  <div className="space-y-1">
                    <Label>Notas</Label>
                    <Textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between items-center pt-3 border-t mt-2">
                <div className="text-sm">
                  <div className="text-muted-foreground">Total compra</div>
                  <div className="text-2xl font-bold">{fmt(total)}</div>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar Compra
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>NCF</TableHead>
                <TableHead className="text-right">ITBIS</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No hay compras registradas
                  </TableCell>
                </TableRow>
              ) : compras.map(c => (
                <TableRow key={c.id}>
                  <TableCell>{new Date(c.fecha).toLocaleDateString("es-DO")}</TableCell>
                  <TableCell className="font-medium">{c.proveedores?.nombre || "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{c.ncf || <span className="text-destructive">Sin NCF</span>}</TableCell>
                  <TableCell className="text-right">{fmt(Number(c.itbis_facturado || 0))}</TableCell>
                  <TableCell className="font-medium">{fmt(Number(c.total))}</TableCell>
                  <TableCell className="text-muted-foreground">{c.notas || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
