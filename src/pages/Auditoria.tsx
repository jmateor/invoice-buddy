import { traducirError } from "@/lib/errorTranslator";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, ShieldAlert, FileText, Download, Loader2 } from "lucide-react";
import { exportToExcel } from "@/lib/exportUtils";

interface AuditLog {
    id: string;
    created_at: string;
    user_id: string;
    accion: string;
    entidad: string;
    detalles: any;
}

interface UserProfile {
    id: string;
    user_id: string;
    nombre: string;
    email: string | null;
}

export default function Auditoria() {
    const { isAdmin, loading: permLoading } = usePermissions();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const pageSize = 50;

    const loadLogs = async (pageNumber = 0) => {
        setLoading(true);
        const [auditRes, profilesRes] = await Promise.all([
            supabase
                .from("audit_logs")
                .select("*")
                .order("created_at", { ascending: false })
                .range(pageNumber * pageSize, (pageNumber + 1) * pageSize - 1),
            supabase.from("profiles").select("id, user_id, nombre, email")
        ]);

        if (auditRes.error) {
            toast.error(auditRes.error.message);
        } else {
            setLogs((auditRes.data as any) || []);
            setProfiles((profilesRes.data as any) || []);
            setPage(pageNumber);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isAdmin) loadLogs(0);
    }, [isAdmin]);

    const getProfileName = (userId: string) => {
        const p = profiles.find(profile => profile.user_id === userId);
        return p ? (p.nombre || p.email || userId.slice(0, 8)) : "Sistema";
    };

    const handleExport = () => {
        exportToExcel(
            logs.map(log => ({
                Fecha: new Date(log.created_at).toLocaleString("es-DO"),
                Usuario: getProfileName(log.user_id),
                Acción: log.accion,
                Entidad: log.entidad,
                Detalles: JSON.stringify(log.detalles)
            })),
            "bitacora_auditoria"
        );
        toast.success("Exportado a Excel");
    };

    const filteredLogs = logs.filter(log => {
        const term = search.toLowerCase();
        const userStr = getProfileName(log.user_id).toLowerCase();
        return (
            log.accion.toLowerCase().includes(term) ||
            log.entidad.toLowerCase().includes(term) ||
            userStr.includes(term)
        );
    });

    if (permLoading || loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <ShieldAlert className="h-12 w-12 mb-4 opacity-40" />
                <h2 className="text-lg font-semibold text-foreground">Acceso Restringido</h2>
                <p className="text-sm mt-1">Solo los administradores pueden ver la bitácora de auditoría.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Bitácora de Auditoría</h1>
                    <p className="text-muted-foreground">Registro de todas las acciones del sistema</p>
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Exportar Excel
                </Button>
            </div>

            <Card>
                <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-9"
                            placeholder="Buscar por usuario, acción o módulo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => loadLogs(page > 0 ? page - 1 : 0)} disabled={page === 0}>Anterior</Button>
                        <Button variant="ghost" size="sm" disabled>Pág. {page + 1}</Button>
                        <Button variant="ghost" size="sm" onClick={() => loadLogs(page + 1)} disabled={logs.length < pageSize}>Siguiente</Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Acción</TableHead>
                                <TableHead>Módulo</TableHead>
                                <TableHead>Detalles</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        No hay registros de auditoría
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap text-sm">
                                            {new Date(log.created_at).toLocaleString("es-DO")}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {getProfileName(log.user_id)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {log.accion.replace(/_/g, " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="capitalize">{log.entidad.replace(/_/g, " ")}</TableCell>
                                        <TableCell className="text-xs max-w-[200px] truncate" title={JSON.stringify(log.detalles)}>
                                            {JSON.stringify(log.detalles)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
