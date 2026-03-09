import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, RotateCcw } from "lucide-react";

interface NotaCredito {
  id: string;
  motivo: string;
  total: number;
  created_at: string;
  facturas: { numero: string } | null;
  clientes: { nombre: string } | null;
}

export default function NotasCredito() {
  const { user } = useAuth();
  const [notas, setNotas] = useState<NotaCredito[]>([]);
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("notas_credito")
      .select("id, motivo, total, created_at, facturas(numero), clientes(nombre)")
      .order("created_at", { ascending: false });
    setNotas((data as any) || []);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const filtered = notas.filter(n =>
    (n.facturas?.numero || "").includes(search) ||
    (n.clientes?.nombre || "").toLowerCase().includes(search.toLowerCase()) ||
    n.motivo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notas de Crédito</h1>
        <p className="text-muted-foreground">{notas.length} registradas</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por factura, cliente o motivo..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No hay notas de crédito
                  </TableCell>
                </TableRow>
              ) : filtered.map(n => (
                <TableRow key={n.id}>
                  <TableCell className="text-sm">{new Date(n.created_at).toLocaleDateString("es-DO")}</TableCell>
                  <TableCell className="font-mono text-sm">{n.facturas?.numero || "—"}</TableCell>
                  <TableCell>{n.clientes?.nombre || "—"}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{n.motivo}</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    RD$ {Number(n.total).toLocaleString("es-DO", { minimumFractionDigits: 2 })}
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
