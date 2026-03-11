import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RotateCcw, Download, Printer } from "lucide-react";
import { generateCreditNotePDF, type CreditNoteData } from "@/lib/generateCreditNotePDF";
import type { NegocioData } from "@/lib/generateInvoicePDF";

interface NotaCredito {
  id: string;
  numero: string | null;
  motivo: string;
  total: number;
  saldo_disponible: number;
  estado: string;
  created_at: string;
  facturas: { numero: string } | null;
  clientes: { nombre: string; rnc_cedula: string | null } | null;
}

export default function NotasCredito() {
  const { user } = useAuth();
  const [notas, setNotas] = useState<NotaCredito[]>([]);
  const [search, setSearch] = useState("");
  const [negocio, setNegocio] = useState<NegocioData | null>(null);
  const [formatoImpresion, setFormatoImpresion] = useState<"carta" | "80mm" | "58mm">("80mm");

  const load = async () => {
    const [notasRes, negRes] = await Promise.all([
      supabase
        .from("notas_credito")
        .select("id, numero, motivo, total, saldo_disponible, estado, created_at, facturas(numero), clientes(nombre, rnc_cedula)" as any)
        .order("created_at", { ascending: false }),
      supabase
        .from("configuracion_negocio")
        .select("nombre_comercial, razon_social, rnc, direccion, telefono, whatsapp, email, logo_url, mensaje_factura, formato_impresion")
        .maybeSingle(),
    ]);
    setNotas((notasRes.data as any) || []);
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

  const handlePDF = async (n: NotaCredito, action: "download" | "print") => {
    const { data: detalles } = await supabase
      .from("detalle_notas_credito")
      .select("cantidad, precio_unitario, subtotal, productos(nombre)")
      .eq("nota_credito_id", n.id);

    const pdfData: CreditNoteData = {
      numero: n.numero || n.id.slice(0, 8).toUpperCase(),
      fecha: n.created_at,
      facturaNumero: n.facturas?.numero || "—",
      cliente: { nombre: n.clientes?.nombre || "", rnc_cedula: n.clientes?.rnc_cedula },
      motivo: n.motivo,
      detalles: (detalles || []).map((d: any) => ({
        nombre: d.productos?.nombre || "",
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        subtotal: d.subtotal,
      })),
      total: Number(n.total),
      negocio: negocio || undefined,
      formato: formatoImpresion,
    };
    generateCreditNotePDF(pdfData, action);
  };

  const filtered = notas.filter(n =>
    (n.facturas?.numero || "").includes(search) ||
    (n.clientes?.nombre || "").toLowerCase().includes(search.toLowerCase()) ||
    n.motivo.toLowerCase().includes(search.toLowerCase()) ||
    (n.numero || "").toLowerCase().includes(search.toLowerCase())
  );

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case "consumida": return <Badge variant="secondary">Consumida</Badge>;
      case "parcial": return <Badge className="bg-amber-500/15 text-amber-700 border-amber-300 hover:bg-amber-500/25">Parcial</Badge>;
      default: return <Badge variant="default">Pendiente</Badge>;
    }
  };

  const fmt = (n: number) => `RD$ ${Number(n).toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notas de Crédito</h1>
        <p className="text-muted-foreground">{notas.length} registradas</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por factura, cliente, NC# o motivo..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
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
                <TableHead>Fecha</TableHead>
                <TableHead>NC #</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No hay notas de crédito
                  </TableCell>
                </TableRow>
              ) : filtered.map(n => (
                <TableRow key={n.id}>
                  <TableCell className="text-sm">{new Date(n.created_at).toLocaleDateString("es-DO")}</TableCell>
                  <TableCell className="font-mono text-sm">{n.numero || n.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell className="font-mono text-sm">{n.facturas?.numero || "—"}</TableCell>
                  <TableCell>{n.clientes?.nombre || "—"}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{n.motivo}</TableCell>
                  <TableCell>{estadoBadge(n.estado)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {fmt(n.total)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {fmt(n.saldo_disponible)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handlePDF(n, "download")} title="Descargar PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handlePDF(n, "print")} title="Imprimir">
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
