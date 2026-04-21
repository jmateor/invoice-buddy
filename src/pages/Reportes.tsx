import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, BarChart3, Package, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useReportData } from "@/hooks/useReportData";
import ReportFilters from "@/components/reportes/ReportFilters";
import ReportTable from "@/components/reportes/ReportTable";
import GuiaUso from "@/components/GuiaUso";
import { exportToExcel } from "@/lib/exportUtils";

const fmt = (n: number) => `RD$ ${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

interface R607 { rnc_cedula: string; tipo_id: string; ncf: string; fecha: string; monto_facturado: number; itbis_facturado: number; forma_pago: string; }
interface R606 { rnc_cedula: string; tipo_id: string; fecha: string; monto_facturado: number; itbis_facturado: number; forma_pago: string; }
interface R608 { ncf: string; tipo: string; fecha_anulacion: string; }

const formaPagoMap: Record<string, string> = { efectivo: "01", tarjeta: "02", transferencia: "03", nota_credito: "04" };

export default function Reportes() {
  const { user } = useAuth();
  const { filters, setFilters, rows, summary, clientes, productos, categorias, loading, groupedData, exportData } = useReportData();
  const grouped = groupedData();
  const chartConfig = { total: { label: "Total", color: "hsl(217, 71%, 45%)" } };

  // ---- DGII ----
  const [fechaDesde, setFechaDesde] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; });
  const [fechaHasta, setFechaHasta] = useState(() => new Date().toISOString().split("T")[0]);
  const [dgiiLoading, setDgiiLoading] = useState(false);
  const [data607, setData607] = useState<R607[]>([]);
  const [data606, setData606] = useState<R606[]>([]);
  const [data608, setData608] = useState<R608[]>([]);

  const loadDgii = useCallback(async () => {
    if (!user) return;
    setDgiiLoading(true);
    try {
      const { data: facturas } = await supabase.from("facturas")
        .select("ncf, tipo_comprobante, fecha, total, itbis, metodo_pago, estado, clientes(rnc_cedula)")
        .gte("fecha", fechaDesde + "T00:00:00").lte("fecha", fechaHasta + "T23:59:59")
        .neq("estado", "borrador" as any);

      setData607((facturas || []).filter((f: any) => f.estado !== "anulada").map((f: any) => ({
        rnc_cedula: f.clientes?.rnc_cedula || "",
        tipo_id: f.clientes?.rnc_cedula?.length === 9 ? "1" : f.clientes?.rnc_cedula?.length === 11 ? "2" : "",
        ncf: f.ncf || "",
        fecha: new Date(f.fecha).toLocaleDateString("es-DO"),
        monto_facturado: Number(f.total),
        itbis_facturado: Number(f.itbis),
        forma_pago: formaPagoMap[f.metodo_pago] || "01",
      })));

      const { data: compras } = await supabase.from("compras")
        .select("total, fecha, proveedores(rnc)")
        .gte("fecha", fechaDesde + "T00:00:00").lte("fecha", fechaHasta + "T23:59:59");
      setData606((compras || []).map((c: any) => ({
        rnc_cedula: c.proveedores?.rnc || "",
        tipo_id: c.proveedores?.rnc?.length === 9 ? "1" : "2",
        fecha: new Date(c.fecha).toLocaleDateString("es-DO"),
        monto_facturado: Number(c.total),
        itbis_facturado: Number(c.total) * 0.18 / 1.18,
        forma_pago: "01",
      })));

      const { data: anuladas } = await supabase.from("facturas")
        .select("ncf, tipo_comprobante, fecha").eq("estado", "anulada" as any)
        .gte("fecha", fechaDesde + "T00:00:00").lte("fecha", fechaHasta + "T23:59:59");
      setData608((anuladas || []).filter((a: any) => a.ncf).map((a: any) => ({
        ncf: a.ncf, tipo: a.tipo_comprobante || "B02",
        fecha_anulacion: new Date(a.fecha).toLocaleDateString("es-DO"),
      })));
    } catch (err: any) { toast.error(err.message || "Error cargando reportes"); }
    setDgiiLoading(false);
  }, [user, fechaDesde, fechaHasta]);

  useEffect(() => { loadDgii(); }, [loadDgii]);

  const exportarDgii = (tipo: "607" | "606" | "608") => {
    const map = { "607": data607, "606": data606, "608": data608 } as const;
    const arr = map[tipo];
    if (arr.length === 0) { toast.error("No hay datos"); return; }
    exportToExcel(arr as any, `${tipo}-${fechaDesde}-${fechaHasta}`);
    toast.success(`Reporte ${tipo} exportado`);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-muted-foreground">Analítica del negocio y reportes fiscales para la DGII</p>
      </div>

      <GuiaUso
        storageKey="reportes"
        titulo="Cómo usar los reportes"
        pasos={[
          { titulo: "Operativos", descripcion: "Ventas, ganancia y top productos para gerencia." },
          { titulo: "DGII", descripcion: "Formatos 606, 607 y 608 listos para subir al portal de la DGII." },
          { titulo: "Exporta", descripcion: "Descarga Excel/CSV con un clic desde cualquier pestaña." },
        ]}
        tip="Ajusta el rango de fechas según el período fiscal que vas a declarar."
      />

      <Tabs defaultValue="operativos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="operativos">Operativos</TabsTrigger>
          <TabsTrigger value="dgii">DGII (606/607/608)</TabsTrigger>
        </TabsList>

        {/* ===== OPERATIVOS ===== */}
        <TabsContent value="operativos" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <ReportFilters filters={filters} onChange={setFilters} clientes={clientes} productos={productos} categorias={categorias} exportData={exportData} />
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Ventas</CardTitle>
                <TrendingUp className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{fmt(summary.totalVentas)}</div></CardContent>
            </Card>
            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Facturas</CardTitle>
                <BarChart3 className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{summary.totalFacturas}</div></CardContent>
            </Card>
            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Productos Vendidos</CardTitle>
                <Package className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{summary.totalProductos}</div></CardContent>
            </Card>
            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Ganancia</CardTitle>
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(summary.totalGanancia)}</div></CardContent>
            </Card>
          </div>

          <Tabs defaultValue="tabla" className="space-y-4">
            <TabsList>
              <TabsTrigger value="tabla">Detalle</TabsTrigger>
              <TabsTrigger value="grafica">Gráfica</TabsTrigger>
            </TabsList>
            <TabsContent value="tabla">
              <Card>
                <CardHeader><CardTitle className="text-base">Detalle de Ventas ({rows.length} registros)</CardTitle></CardHeader>
                <CardContent><ReportTable rows={rows} loading={loading} /></CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="grafica">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Ventas por {filters.agrupacion === "diario" ? "Día" : filters.agrupacion === "mensual" ? "Mes" : "Año"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {grouped.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No hay datos para graficar</p>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <BarChart data={grouped}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" fontSize={11} />
                        <YAxis fontSize={11} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                        <ChartTooltip content={<ChartTooltipContent formatter={v => fmt(Number(v))} />} />
                        <Bar dataKey="total" fill="hsl(217, 71%, 45%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ===== DGII ===== */}
        <TabsContent value="dgii" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Desde</Label>
                  <Input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hasta</Label>
                  <Input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
                </div>
                <Button onClick={loadDgii} disabled={dgiiLoading}>
                  {dgiiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                  Generar Reportes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="607">
            <TabsList>
              <TabsTrigger value="607">607 – Ventas <Badge variant="secondary" className="ml-2">{data607.length}</Badge></TabsTrigger>
              <TabsTrigger value="606">606 – Compras <Badge variant="secondary" className="ml-2">{data606.length}</Badge></TabsTrigger>
              <TabsTrigger value="608">608 – Anulaciones <Badge variant="secondary" className="ml-2">{data608.length}</Badge></TabsTrigger>
            </TabsList>

            <TabsContent value="607">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Reporte 607 – Ventas de Bienes y Servicios</CardTitle>
                  <Button size="sm" onClick={() => exportarDgii("607")}><Download className="mr-2 h-4 w-4" />Exportar Excel</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>RNC/Cédula</TableHead><TableHead>NCF</TableHead><TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Monto</TableHead><TableHead className="text-right">ITBIS</TableHead><TableHead>Pago</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {data607.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sin datos</TableCell></TableRow>
                        ) : data607.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{r.rnc_cedula || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{r.ncf || "—"}</TableCell>
                            <TableCell className="text-xs">{r.fecha}</TableCell>
                            <TableCell className="text-right font-medium">{fmt(r.monto_facturado)}</TableCell>
                            <TableCell className="text-right">{fmt(r.itbis_facturado)}</TableCell>
                            <TableCell>{r.forma_pago}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="606">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Reporte 606 – Compras de Bienes y Servicios</CardTitle>
                  <Button size="sm" onClick={() => exportarDgii("606")}><Download className="mr-2 h-4 w-4" />Exportar Excel</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>RNC Proveedor</TableHead><TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Monto</TableHead><TableHead className="text-right">ITBIS</TableHead><TableHead>Pago</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {data606.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin datos</TableCell></TableRow>
                        ) : data606.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{r.rnc_cedula || "—"}</TableCell>
                            <TableCell className="text-xs">{r.fecha}</TableCell>
                            <TableCell className="text-right font-medium">{fmt(r.monto_facturado)}</TableCell>
                            <TableCell className="text-right">{fmt(r.itbis_facturado)}</TableCell>
                            <TableCell>{r.forma_pago}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="608">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Reporte 608 – Comprobantes Anulados</CardTitle>
                  <Button size="sm" onClick={() => exportarDgii("608")}><Download className="mr-2 h-4 w-4" />Exportar Excel</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>NCF</TableHead><TableHead>Tipo</TableHead><TableHead>Fecha Anulación</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {data608.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Sin datos</TableCell></TableRow>
                      ) : data608.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono">{r.ncf}</TableCell>
                          <TableCell>{r.tipo}</TableCell>
                          <TableCell>{r.fecha_anulacion}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardContent className="pt-6 text-xs text-muted-foreground space-y-1">
              <p><strong>607:</strong> ventas emitidas (sin borradores ni anuladas).</p>
              <p><strong>606:</strong> compras a proveedores.</p>
              <p><strong>608:</strong> comprobantes con NCF anulados.</p>
              <p className="text-primary font-medium mt-2">Los archivos Excel son compatibles con el portal de la DGII.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
