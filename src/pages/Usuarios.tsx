
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions, type AppRole } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Shield, Users, History, Loader2, Save, ShieldCheck, ShieldAlert,
  UserPlus, Camera, Pencil, Trash2, UserX, UserCheck, MoreHorizontal
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { createClient } from "@supabase/supabase-js";
import { traducirError } from "@/lib/errorTranslator";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const adminAuthClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

interface UserProfile {
  id: string;
  user_id: string;
  nombre: string;
  email: string | null;
  cedula?: string;
  avatar_url?: string;
  activo?: boolean;
  fecha_desactivacion?: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

interface AuditLog {
  id: string;
  user_id: string;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  detalles: any;
  created_at: string;
}

const ROLE_CONFIG: Record<AppRole, { label: string; color: string; desc: string }> = {
  admin: { label: "Administrador", color: "default", desc: "Acceso total al sistema" },
  cajero: { label: "Cajero", color: "secondary", desc: "Ventas y facturación básica" },
  contador: { label: "Contador", color: "outline", desc: "Reportes y exportaciones" },
};

const PERMISSION_MATRIX: { permission: string; admin: boolean; cajero: boolean; contador: boolean }[] = [
  { permission: "Crear facturas", admin: true, cajero: true, contador: false },
  { permission: "Anular facturas", admin: true, cajero: false, contador: false },
  { permission: "Eliminar facturas", admin: true, cajero: false, contador: false },
  { permission: "Cambiar precios", admin: true, cajero: false, contador: false },
  { permission: "Aplicar descuentos", admin: true, cajero: false, contador: true },
  { permission: "Ver reportes", admin: true, cajero: false, contador: true },
  { permission: "Exportar datos", admin: true, cajero: false, contador: true },
  { permission: "Configuración", admin: true, cajero: false, contador: false },
  { permission: "Gestionar usuarios", admin: true, cajero: false, contador: false },
  { permission: "Registrar compras", admin: true, cajero: false, contador: true },
  { permission: "Gestionar inventario", admin: true, cajero: false, contador: false },
];

export default function Usuarios() {
  const { user } = useAuth();
  const { isAdmin, loading: permLoading } = usePermissions();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<Record<string, AppRole>>({});

  // Create modal
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ nombre: "", email: "", password: "", role: "cajero" as AppRole, cedula: "" });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Edit modal
  const [editModal, setEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({ nombre: "", cedula: "", email: "" });
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) return;
    loadData();
  }, [user, isAdmin]);

  const loadData = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, logsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("nombre"),
      supabase.from("user_roles").select("*"),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setProfiles((profilesRes.data as any) || []);
    setRoles((rolesRes.data as any) || []);
    setLogs((logsRes.data as any) || []);
    setLoading(false);
  };

  const getRoleForUser = (userId: string): AppRole => {
    if (pendingChanges[userId]) return pendingChanges[userId];
    const r = roles.find(r => r.user_id === userId);
    return (r?.role as AppRole) || "cajero";
  };

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    setPendingChanges(prev => ({ ...prev, [userId]: newRole }));
  };

  const saveRole = async (userId: string) => {
    const newRole = pendingChanges[userId];
    if (!newRole) return;
    const existingRole = roles.find(r => r.user_id === userId);
    let error;
    if (existingRole) {
      ({ error } = await supabase.from("user_roles").update({ role: newRole } as any).eq("id", existingRole.id));
    } else {
      ({ error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole } as any));
    }
    if (error) {
      toast.error(traducirError(error.message));
    } else {
      toast.success("Rol actualizado");
      await supabase.from("audit_logs").insert({
        user_id: user!.id, accion: "cambio_rol", entidad: "user_roles",
        entidad_id: userId, detalles: { nuevo_rol: newRole, anterior: existingRole?.role || "ninguno" },
      } as any);
      setPendingChanges(prev => { const n = { ...prev }; delete n[userId]; return n; });
      loadData();
    }
  };

  const getProfileName = (userId: string) => {
    return profiles.find(p => p.user_id === userId)?.nombre || profiles.find(p => p.user_id === userId)?.email || userId.slice(0, 8);
  };

  // Avatar change handlers
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };
  const handleEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setEditAvatarFile(file); setEditAvatarPreview(URL.createObjectURL(file)); }
  };

  // Upload avatar helper
  const uploadAvatar = async (userId: string, file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) return "";
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    return urlData.publicUrl;
  };

  // CREATE USER
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const { data, error } = await adminAuthClient.auth.signUp({
      email: newUser.email, password: newUser.password,
      options: { data: { nombre: newUser.nombre, role: newUser.role } },
    });
    if (error) {
      toast.error(traducirError(error.message));
    } else {
      const newUserId = data.user?.id;
      let avatarUrl = "";
      if (avatarFile && newUserId) avatarUrl = await uploadAvatar(newUserId, avatarFile);
      if (newUserId) {
        await supabase.from("profiles").update({ cedula: newUser.cedula, avatar_url: avatarUrl } as any).eq("user_id", newUserId);
      }
      toast.success("Usuario creado exitosamente");
      await supabase.from("audit_logs").insert({
        user_id: user!.id, accion: "crear_usuario", entidad: "profiles",
        detalles: { email: newUser.email, rol: newUser.role, cedula: newUser.cedula },
      } as any);
      setCreateModal(false);
      setNewUser({ nombre: "", email: "", password: "", role: "cajero", cedula: "" });
      setAvatarFile(null); setAvatarPreview(null);
      loadData();
    }
    setCreating(false);
  };

  // EDIT USER
  const openEditModal = (p: UserProfile) => {
    setEditingProfile(p);
    setEditForm({ nombre: p.nombre || "", cedula: (p as any).cedula || "", email: p.email || "" });
    setEditAvatarPreview((p as any).avatar_url || null);
    setEditAvatarFile(null);
    setEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    setSaving(true);
    let avatarUrl = (editingProfile as any).avatar_url || "";
    if (editAvatarFile) {
      avatarUrl = await uploadAvatar(editingProfile.user_id, editAvatarFile);
    }
    const { error } = await supabase.from("profiles").update({
      nombre: editForm.nombre, cedula: editForm.cedula, avatar_url: avatarUrl,
    } as any).eq("user_id", editingProfile.user_id);
    if (error) {
      toast.error(traducirError(error.message));
    } else {
      toast.success("Usuario actualizado");
      await supabase.from("audit_logs").insert({
        user_id: user!.id, accion: "editar_usuario", entidad: "profiles",
        entidad_id: editingProfile.user_id, detalles: { nombre: editForm.nombre, cedula: editForm.cedula },
      } as any);
      setEditModal(false);
      loadData();
    }
    setSaving(false);
  };

  // TOGGLE ACTIVE STATUS
  const toggleUserActive = async (p: UserProfile) => {
    const newStatus = !(p.activo ?? true);
    const updateData: any = {
      activo: newStatus,
      fecha_desactivacion: newStatus ? null : new Date().toISOString(),
    };
    const { error } = await supabase.from("profiles").update(updateData).eq("user_id", p.user_id);
    if (error) {
      toast.error(traducirError(error.message));
    } else {
      toast.success(newStatus ? "Usuario reactivado" : "Usuario desactivado");
      await supabase.from("audit_logs").insert({
        user_id: user!.id, accion: newStatus ? "reactivar_usuario" : "desactivar_usuario",
        entidad: "profiles", entidad_id: p.user_id,
        detalles: { nombre: p.nombre, fecha: new Date().toISOString() },
      } as any);
      loadData();
    }
  };

  // DELETE USER (profile + role only, auth user remains)
  const deleteUser = async (p: UserProfile) => {
    if (!confirm(`¿Estás seguro de eliminar a "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    const [roleRes, profileRes] = await Promise.all([
      supabase.from("user_roles").delete().eq("user_id", p.user_id),
      supabase.from("profiles").delete().eq("user_id", p.user_id),
    ]);
    if (profileRes.error) {
      toast.error(profileRes.error.message);
    } else {
      toast.success("Usuario eliminado");
      await supabase.from("audit_logs").insert({
        user_id: user!.id, accion: "eliminar_usuario", entidad: "profiles",
        entidad_id: p.user_id, detalles: { nombre: p.nombre, email: p.email },
      } as any);
      loadData();
    }
  };

  if (permLoading || loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <ShieldAlert className="h-12 w-12 mb-4 opacity-40" />
        <h2 className="text-lg font-semibold text-foreground">Acceso Restringido</h2>
        <p className="text-sm mt-1">Solo los administradores pueden gestionar usuarios y roles.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuarios y Roles</h1>
        <p className="text-muted-foreground">Administra usuarios, asigna roles y revisa la actividad del sistema</p>
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="usuarios"><Users className="h-4 w-4 mr-1.5" />Usuarios</TabsTrigger>
          <TabsTrigger value="permisos"><Shield className="h-4 w-4 mr-1.5" />Permisos</TabsTrigger>
          <TabsTrigger value="auditoria"><History className="h-4 w-4 mr-1.5" />Auditoría</TabsTrigger>
        </TabsList>

        {/* ===== TAB USUARIOS ===== */}
        <TabsContent value="usuarios" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Usuarios Registrados</CardTitle>
                <CardDescription>Crea, edita, desactiva o elimina usuarios del sistema</CardDescription>
              </div>

              {/* CREATE MODAL */}
              <Dialog open={createModal} onOpenChange={setCreateModal}>
                <DialogTrigger asChild>
                  <Button size="sm"><UserPlus className="h-4 w-4 mr-2" />Nuevo Usuario</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    <DialogDescription>Genera una nueva cuenta para otro miembro del equipo.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                    <div className="flex justify-center">
                      <label className="relative cursor-pointer group">
                        <Avatar className="h-20 w-20 border-2 border-dashed border-muted-foreground/40 group-hover:border-primary transition-colors">
                          {avatarPreview ? <AvatarImage src={avatarPreview} alt="Preview" /> : <AvatarFallback className="bg-muted"><Camera className="h-6 w-6 text-muted-foreground" /></AvatarFallback>}
                        </Avatar>
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        <span className="text-[10px] text-muted-foreground block text-center mt-1">Foto</span>
                      </label>
                    </div>
                    <div className="space-y-2"><Label>Nombre Completo</Label><Input value={newUser.nombre} onChange={e => setNewUser({ ...newUser, nombre: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Cédula</Label><Input value={newUser.cedula} onChange={e => setNewUser({ ...newUser, cedula: e.target.value })} placeholder="000-0000000-0" required /></div>
                    <div className="space-y-2"><Label>Correo Electrónico</Label><Input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Contraseña (Min. 6 caracteres)</Label><Input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} minLength={6} required /></div>
                    <div className="space-y-2">
                      <Label>Rol en el Sistema</Label>
                      <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as AppRole })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(ROLE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label} - {v.desc}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setCreateModal(false)}>Cancelar</Button>
                      <Button type="submit" disabled={creating}>{creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Crear Cuenta</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* EDIT MODAL */}
              <Dialog open={editModal} onOpenChange={setEditModal}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar Usuario</DialogTitle>
                    <DialogDescription>Actualiza la información del usuario.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleEditUser} className="space-y-4 py-4">
                    <div className="flex justify-center">
                      <label className="relative cursor-pointer group">
                        <Avatar className="h-20 w-20 border-2 border-dashed border-muted-foreground/40 group-hover:border-primary transition-colors">
                          {editAvatarPreview ? <AvatarImage src={editAvatarPreview} alt="Preview" /> : <AvatarFallback className="bg-muted"><Camera className="h-6 w-6 text-muted-foreground" /></AvatarFallback>}
                        </Avatar>
                        <input type="file" accept="image/*" className="hidden" onChange={handleEditAvatarChange} />
                        <span className="text-[10px] text-muted-foreground block text-center mt-1">Cambiar foto</span>
                      </label>
                    </div>
                    <div className="space-y-2"><Label>Nombre Completo</Label><Input value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} required /></div>
                    <div className="space-y-2"><Label>Cédula</Label><Input value={editForm.cedula} onChange={e => setEditForm({ ...editForm, cedula: e.target.value })} placeholder="000-0000000-0" /></div>
                    <div className="space-y-2"><Label>Correo Electrónico</Label><Input type="email" value={editForm.email} disabled className="opacity-60" /></div>
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setEditModal(false)}>Cancelar</Button>
                      <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Guardar Cambios</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email / Cédula</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead>Fecha Desactivación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map(p => {
                    const currentRole = getRoleForUser(p.user_id);
                    const hasPending = !!pendingChanges[p.user_id];
                    const isCurrentUser = p.user_id === user?.id;
                    const isActive = p.activo ?? true;

                    return (
                      <TableRow key={p.id} className={!isActive ? "opacity-50" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              {(p as any).avatar_url ? <AvatarImage src={(p as any).avatar_url} /> : <AvatarFallback className="text-xs bg-muted">{(p.nombre || "?")[0].toUpperCase()}</AvatarFallback>}
                            </Avatar>
                            <div>
                              <span className="font-medium text-sm">{p.nombre || "—"}</span>
                              {isCurrentUser && <Badge variant="outline" className="ml-2 text-[10px]">Tú</Badge>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">{p.email || "—"}</div>
                          {(p as any).cedula && <div className="text-xs text-muted-foreground">Céd: {(p as any).cedula}</div>}
                        </TableCell>
                        <TableCell>
                          {isActive
                            ? <Badge variant="default" className="text-[10px]">Activo</Badge>
                            : <Badge variant="destructive" className="text-[10px]">Inactivo</Badge>
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Select value={currentRole} onValueChange={(v) => handleRoleChange(p.user_id, v as AppRole)} disabled={isCurrentUser}>
                              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{Object.entries(ROLE_CONFIG).map(([key, val]) => <SelectItem key={key} value={key}>{val.label}</SelectItem>)}</SelectContent>
                            </Select>
                            {hasPending && (
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveRole(p.user_id)}>
                                <Save className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(p.created_at).toLocaleDateString("es-DO")}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {p.fecha_desactivacion ? new Date(p.fecha_desactivacion).toLocaleDateString("es-DO") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isCurrentUser && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditModal(p)}>
                                  <Pencil className="h-3.5 w-3.5 mr-2" />Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleUserActive(p)}>
                                  {isActive
                                    ? <><UserX className="h-3.5 w-3.5 mr-2" />Desactivar</>
                                    : <><UserCheck className="h-3.5 w-3.5 mr-2" />Reactivar</>
                                  }
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteUser(p)}>
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {profiles.length === 0 && (
                <p className="text-center py-8 text-sm text-muted-foreground">No hay usuarios registrados</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB PERMISOS ===== */}
        <TabsContent value="permisos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Matriz de Permisos por Rol</CardTitle>
              <CardDescription>Vista general de permisos asignados a cada rol</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permiso</TableHead>
                    <TableHead className="text-center"><div className="flex items-center justify-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Admin</div></TableHead>
                    <TableHead className="text-center">Cajero</TableHead>
                    <TableHead className="text-center">Contador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERMISSION_MATRIX.map(row => (
                    <TableRow key={row.permission}>
                      <TableCell className="font-medium text-sm">{row.permission}</TableCell>
                      <TableCell className="text-center">{row.admin ? "✅" : "❌"}</TableCell>
                      <TableCell className="text-center">{row.cajero ? "✅" : "❌"}</TableCell>
                      <TableCell className="text-center">{row.contador ? "✅" : "❌"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB AUDITORÍA ===== */}
        <TabsContent value="auditoria" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registro de Actividad</CardTitle>
              <CardDescription>Últimas 50 acciones registradas en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Entidad</TableHead>
                      <TableHead>Detalles</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleString("es-DO")}</TableCell>
                        <TableCell className="text-sm">{getProfileName(log.user_id)}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{log.accion}</Badge></TableCell>
                        <TableCell className="text-sm">{log.entidad}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-48 truncate">{log.detalles ? JSON.stringify(log.detalles) : "—"}</TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay registros de actividad</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
