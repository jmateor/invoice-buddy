
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
import { traducirError } from "@/lib/errorTranslator";
  Shield, Users, History, Loader2, Save, ShieldCheck, ShieldAlert,
import { traducirError } from "@/lib/errorTranslator";
  UserPlus, Camera, Pencil, Trash2, UserX, UserCheck, MoreHorizontal
import { traducirError } from "@/lib/errorTranslator";
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { createClient } from "@supabase/supabase-js";
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
import { traducirError } from "@/lib/errorTranslator";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
import { traducirError } from "@/lib/errorTranslator";
const adminAuthClient = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
interface UserProfile {
import { traducirError } from "@/lib/errorTranslator";
  id: string;
import { traducirError } from "@/lib/errorTranslator";
  user_id: string;
import { traducirError } from "@/lib/errorTranslator";
  nombre: string;
import { traducirError } from "@/lib/errorTranslator";
  email: string | null;
import { traducirError } from "@/lib/errorTranslator";
  cedula?: string;
import { traducirError } from "@/lib/errorTranslator";
  avatar_url?: string;
import { traducirError } from "@/lib/errorTranslator";
  activo?: boolean;
import { traducirError } from "@/lib/errorTranslator";
  fecha_desactivacion?: string | null;
import { traducirError } from "@/lib/errorTranslator";
  created_at: string;
import { traducirError } from "@/lib/errorTranslator";
}
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
interface UserRole {
import { traducirError } from "@/lib/errorTranslator";
  id: string;
import { traducirError } from "@/lib/errorTranslator";
  user_id: string;
import { traducirError } from "@/lib/errorTranslator";
  role: AppRole;
import { traducirError } from "@/lib/errorTranslator";
}
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
interface AuditLog {
import { traducirError } from "@/lib/errorTranslator";
  id: string;
import { traducirError } from "@/lib/errorTranslator";
  user_id: string;
import { traducirError } from "@/lib/errorTranslator";
  accion: string;
import { traducirError } from "@/lib/errorTranslator";
  entidad: string;
import { traducirError } from "@/lib/errorTranslator";
  entidad_id: string | null;
import { traducirError } from "@/lib/errorTranslator";
  detalles: any;
import { traducirError } from "@/lib/errorTranslator";
  created_at: string;
import { traducirError } from "@/lib/errorTranslator";
}
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
const ROLE_CONFIG: Record<AppRole, { label: string; color: string; desc: string }> = {
import { traducirError } from "@/lib/errorTranslator";
  admin: { label: "Administrador", color: "default", desc: "Acceso total al sistema" },
import { traducirError } from "@/lib/errorTranslator";
  cajero: { label: "Cajero", color: "secondary", desc: "Ventas y facturación básica" },
import { traducirError } from "@/lib/errorTranslator";
  contador: { label: "Contador", color: "outline", desc: "Reportes y exportaciones" },
import { traducirError } from "@/lib/errorTranslator";
};
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
const PERMISSION_MATRIX: { permission: string; admin: boolean; cajero: boolean; contador: boolean }[] = [
import { traducirError } from "@/lib/errorTranslator";
  { permission: "Crear facturas", admin: true, cajero: true, contador: false },
import { traducirError } from "@/lib/errorTranslator";
  { permission: "Anular facturas", admin: true, cajero: false, contador: false },
import { traducirError } from "@/lib/errorTranslator";
  { permission: "Eliminar facturas", admin: true, cajero: false, contador: false },
import { traducirError } from "@/lib/errorTranslator";
  { permission: "Cambiar precios", admin: true, cajero: false, contador: false },
import { traducirError } from "@/lib/errorTranslator";
  { permission: "Aplicar descuentos", admin: true, cajero: false, contador: true },
import { traducirError } from "@/lib/errorTranslator";
  { permission: "Ver reportes", admin: true, cajero: false, contador: true },
import { traducirError } from "@/lib/errorTranslator";
  { permission: "Exportar datos", admin: true, cajero: false, contador: true },
import { traducirError } from "@/lib/errorTranslator";
  { permission: "Configuración", admin: true, cajero: false, contador: false },
import { traducirError } from "@/lib/errorTranslator";
  { permission: "Gestionar usuarios", admin: true, cajero: false, contador: false },
import { traducirError } from "@/lib/errorTranslator";
  { permission: "Registrar compras", admin: true, cajero: false, contador: true },
import { traducirError } from "@/lib/errorTranslator";
  { permission: "Gestionar inventario", admin: true, cajero: false, contador: false },
import { traducirError } from "@/lib/errorTranslator";
];
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
export default function Usuarios() {
import { traducirError } from "@/lib/errorTranslator";
  const { user } = useAuth();
import { traducirError } from "@/lib/errorTranslator";
  const { isAdmin, loading: permLoading } = usePermissions();
import { traducirError } from "@/lib/errorTranslator";
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
import { traducirError } from "@/lib/errorTranslator";
  const [roles, setRoles] = useState<UserRole[]>([]);
import { traducirError } from "@/lib/errorTranslator";
  const [logs, setLogs] = useState<AuditLog[]>([]);
import { traducirError } from "@/lib/errorTranslator";
  const [loading, setLoading] = useState(true);
import { traducirError } from "@/lib/errorTranslator";
  const [pendingChanges, setPendingChanges] = useState<Record<string, AppRole>>({});
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  // Create modal
import { traducirError } from "@/lib/errorTranslator";
  const [createModal, setCreateModal] = useState(false);
import { traducirError } from "@/lib/errorTranslator";
  const [creating, setCreating] = useState(false);
import { traducirError } from "@/lib/errorTranslator";
  const [newUser, setNewUser] = useState({ nombre: "", email: "", password: "", role: "cajero" as AppRole, cedula: "" });
import { traducirError } from "@/lib/errorTranslator";
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
import { traducirError } from "@/lib/errorTranslator";
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  // Edit modal
import { traducirError } from "@/lib/errorTranslator";
  const [editModal, setEditModal] = useState(false);
import { traducirError } from "@/lib/errorTranslator";
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
import { traducirError } from "@/lib/errorTranslator";
  const [editForm, setEditForm] = useState({ nombre: "", cedula: "", email: "" });
import { traducirError } from "@/lib/errorTranslator";
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
import { traducirError } from "@/lib/errorTranslator";
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
import { traducirError } from "@/lib/errorTranslator";
  const [saving, setSaving] = useState(false);
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  useEffect(() => {
import { traducirError } from "@/lib/errorTranslator";
    if (!user || !isAdmin) return;
import { traducirError } from "@/lib/errorTranslator";
    loadData();
import { traducirError } from "@/lib/errorTranslator";
  }, [user, isAdmin]);
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const loadData = async () => {
import { traducirError } from "@/lib/errorTranslator";
    setLoading(true);
import { traducirError } from "@/lib/errorTranslator";
    const [profilesRes, rolesRes, logsRes] = await Promise.all([
import { traducirError } from "@/lib/errorTranslator";
      supabase.from("profiles").select("*").order("nombre"),
import { traducirError } from "@/lib/errorTranslator";
      supabase.from("user_roles").select("*"),
import { traducirError } from "@/lib/errorTranslator";
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50),
import { traducirError } from "@/lib/errorTranslator";
    ]);
import { traducirError } from "@/lib/errorTranslator";
    setProfiles((profilesRes.data as any) || []);
import { traducirError } from "@/lib/errorTranslator";
    setRoles((rolesRes.data as any) || []);
import { traducirError } from "@/lib/errorTranslator";
    setLogs((logsRes.data as any) || []);
import { traducirError } from "@/lib/errorTranslator";
    setLoading(false);
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const getRoleForUser = (userId: string): AppRole => {
import { traducirError } from "@/lib/errorTranslator";
    if (pendingChanges[userId]) return pendingChanges[userId];
import { traducirError } from "@/lib/errorTranslator";
    const r = roles.find(r => r.user_id === userId);
import { traducirError } from "@/lib/errorTranslator";
    return (r?.role as AppRole) || "cajero";
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleRoleChange = (userId: string, newRole: AppRole) => {
import { traducirError } from "@/lib/errorTranslator";
    setPendingChanges(prev => ({ ...prev, [userId]: newRole }));
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const saveRole = async (userId: string) => {
import { traducirError } from "@/lib/errorTranslator";
    const newRole = pendingChanges[userId];
import { traducirError } from "@/lib/errorTranslator";
    if (!newRole) return;
import { traducirError } from "@/lib/errorTranslator";
    const existingRole = roles.find(r => r.user_id === userId);
import { traducirError } from "@/lib/errorTranslator";
    let error;
import { traducirError } from "@/lib/errorTranslator";
    if (existingRole) {
import { traducirError } from "@/lib/errorTranslator";
      ({ error } = await supabase.from("user_roles").update({ role: newRole } as any).eq("id", existingRole.id));
import { traducirError } from "@/lib/errorTranslator";
    } else {
import { traducirError } from "@/lib/errorTranslator";
      ({ error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole } as any));
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";
    if (error) {
import { traducirError } from "@/lib/errorTranslator";
      toast.error(traducirError(error.message));
import { traducirError } from "@/lib/errorTranslator";
    } else {
import { traducirError } from "@/lib/errorTranslator";
      toast.success("Rol actualizado");
import { traducirError } from "@/lib/errorTranslator";
      await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
        user_id: user!.id, accion: "cambio_rol", entidad: "user_roles",
import { traducirError } from "@/lib/errorTranslator";
        entidad_id: userId, detalles: { nuevo_rol: newRole, anterior: existingRole?.role || "ninguno" },
import { traducirError } from "@/lib/errorTranslator";
      } as any);
import { traducirError } from "@/lib/errorTranslator";
      setPendingChanges(prev => { const n = { ...prev }; delete n[userId]; return n; });
import { traducirError } from "@/lib/errorTranslator";
      loadData();
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const getProfileName = (userId: string) => {
import { traducirError } from "@/lib/errorTranslator";
    return profiles.find(p => p.user_id === userId)?.nombre || profiles.find(p => p.user_id === userId)?.email || userId.slice(0, 8);
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  // Avatar change handlers
import { traducirError } from "@/lib/errorTranslator";
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
import { traducirError } from "@/lib/errorTranslator";
    const file = e.target.files?.[0];
import { traducirError } from "@/lib/errorTranslator";
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";
  const handleEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
import { traducirError } from "@/lib/errorTranslator";
    const file = e.target.files?.[0];
import { traducirError } from "@/lib/errorTranslator";
    if (file) { setEditAvatarFile(file); setEditAvatarPreview(URL.createObjectURL(file)); }
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  // Upload avatar helper
import { traducirError } from "@/lib/errorTranslator";
  const uploadAvatar = async (userId: string, file: File): Promise<string> => {
import { traducirError } from "@/lib/errorTranslator";
    const ext = file.name.split(".").pop();
import { traducirError } from "@/lib/errorTranslator";
    const path = `${userId}/avatar.${ext}`;
import { traducirError } from "@/lib/errorTranslator";
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
import { traducirError } from "@/lib/errorTranslator";
    if (error) return "";
import { traducirError } from "@/lib/errorTranslator";
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
import { traducirError } from "@/lib/errorTranslator";
    return urlData.publicUrl;
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  // CREATE USER
import { traducirError } from "@/lib/errorTranslator";
  const handleCreateUser = async (e: React.FormEvent) => {
import { traducirError } from "@/lib/errorTranslator";
    e.preventDefault();
import { traducirError } from "@/lib/errorTranslator";
    setCreating(true);
import { traducirError } from "@/lib/errorTranslator";
    const { data, error } = await adminAuthClient.auth.signUp({
import { traducirError } from "@/lib/errorTranslator";
      email: newUser.email, password: newUser.password,
import { traducirError } from "@/lib/errorTranslator";
      options: { data: { nombre: newUser.nombre, role: newUser.role } },
import { traducirError } from "@/lib/errorTranslator";
    });
import { traducirError } from "@/lib/errorTranslator";
    if (error) {
import { traducirError } from "@/lib/errorTranslator";
      toast.error(traducirError(error.message));
import { traducirError } from "@/lib/errorTranslator";
    } else {
import { traducirError } from "@/lib/errorTranslator";
      const newUserId = data.user?.id;
import { traducirError } from "@/lib/errorTranslator";
      let avatarUrl = "";
import { traducirError } from "@/lib/errorTranslator";
      if (avatarFile && newUserId) avatarUrl = await uploadAvatar(newUserId, avatarFile);
import { traducirError } from "@/lib/errorTranslator";
      if (newUserId) {
import { traducirError } from "@/lib/errorTranslator";
        await supabase.from("profiles").update({ cedula: newUser.cedula, avatar_url: avatarUrl } as any).eq("user_id", newUserId);
import { traducirError } from "@/lib/errorTranslator";
      }
import { traducirError } from "@/lib/errorTranslator";
      toast.success("Usuario creado exitosamente");
import { traducirError } from "@/lib/errorTranslator";
      await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
        user_id: user!.id, accion: "crear_usuario", entidad: "profiles",
import { traducirError } from "@/lib/errorTranslator";
        detalles: { email: newUser.email, rol: newUser.role, cedula: newUser.cedula },
import { traducirError } from "@/lib/errorTranslator";
      } as any);
import { traducirError } from "@/lib/errorTranslator";
      setCreateModal(false);
import { traducirError } from "@/lib/errorTranslator";
      setNewUser({ nombre: "", email: "", password: "", role: "cajero", cedula: "" });
import { traducirError } from "@/lib/errorTranslator";
      setAvatarFile(null); setAvatarPreview(null);
import { traducirError } from "@/lib/errorTranslator";
      loadData();
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";
    setCreating(false);
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  // EDIT USER
import { traducirError } from "@/lib/errorTranslator";
  const openEditModal = (p: UserProfile) => {
import { traducirError } from "@/lib/errorTranslator";
    setEditingProfile(p);
import { traducirError } from "@/lib/errorTranslator";
    setEditForm({ nombre: p.nombre || "", cedula: (p as any).cedula || "", email: p.email || "" });
import { traducirError } from "@/lib/errorTranslator";
    setEditAvatarPreview((p as any).avatar_url || null);
import { traducirError } from "@/lib/errorTranslator";
    setEditAvatarFile(null);
import { traducirError } from "@/lib/errorTranslator";
    setEditModal(true);
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  const handleEditUser = async (e: React.FormEvent) => {
import { traducirError } from "@/lib/errorTranslator";
    e.preventDefault();
import { traducirError } from "@/lib/errorTranslator";
    if (!editingProfile) return;
import { traducirError } from "@/lib/errorTranslator";
    setSaving(true);
import { traducirError } from "@/lib/errorTranslator";
    let avatarUrl = (editingProfile as any).avatar_url || "";
import { traducirError } from "@/lib/errorTranslator";
    if (editAvatarFile) {
import { traducirError } from "@/lib/errorTranslator";
      avatarUrl = await uploadAvatar(editingProfile.user_id, editAvatarFile);
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";
    const { error } = await supabase.from("profiles").update({
import { traducirError } from "@/lib/errorTranslator";
      nombre: editForm.nombre, cedula: editForm.cedula, avatar_url: avatarUrl,
import { traducirError } from "@/lib/errorTranslator";
    } as any).eq("user_id", editingProfile.user_id);
import { traducirError } from "@/lib/errorTranslator";
    if (error) {
import { traducirError } from "@/lib/errorTranslator";
      toast.error(traducirError(error.message));
import { traducirError } from "@/lib/errorTranslator";
    } else {
import { traducirError } from "@/lib/errorTranslator";
      toast.success("Usuario actualizado");
import { traducirError } from "@/lib/errorTranslator";
      await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
        user_id: user!.id, accion: "editar_usuario", entidad: "profiles",
import { traducirError } from "@/lib/errorTranslator";
        entidad_id: editingProfile.user_id, detalles: { nombre: editForm.nombre, cedula: editForm.cedula },
import { traducirError } from "@/lib/errorTranslator";
      } as any);
import { traducirError } from "@/lib/errorTranslator";
      setEditModal(false);
import { traducirError } from "@/lib/errorTranslator";
      loadData();
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";
    setSaving(false);
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  // TOGGLE ACTIVE STATUS
import { traducirError } from "@/lib/errorTranslator";
  const toggleUserActive = async (p: UserProfile) => {
import { traducirError } from "@/lib/errorTranslator";
    const newStatus = !(p.activo ?? true);
import { traducirError } from "@/lib/errorTranslator";
    const updateData: any = {
import { traducirError } from "@/lib/errorTranslator";
      activo: newStatus,
import { traducirError } from "@/lib/errorTranslator";
      fecha_desactivacion: newStatus ? null : new Date().toISOString(),
import { traducirError } from "@/lib/errorTranslator";
    };
import { traducirError } from "@/lib/errorTranslator";
    const { error } = await supabase.from("profiles").update(updateData).eq("user_id", p.user_id);
import { traducirError } from "@/lib/errorTranslator";
    if (error) {
import { traducirError } from "@/lib/errorTranslator";
      toast.error(traducirError(error.message));
import { traducirError } from "@/lib/errorTranslator";
    } else {
import { traducirError } from "@/lib/errorTranslator";
      toast.success(newStatus ? "Usuario reactivado" : "Usuario desactivado");
import { traducirError } from "@/lib/errorTranslator";
      await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
        user_id: user!.id, accion: newStatus ? "reactivar_usuario" : "desactivar_usuario",
import { traducirError } from "@/lib/errorTranslator";
        entidad: "profiles", entidad_id: p.user_id,
import { traducirError } from "@/lib/errorTranslator";
        detalles: { nombre: p.nombre, fecha: new Date().toISOString() },
import { traducirError } from "@/lib/errorTranslator";
      } as any);
import { traducirError } from "@/lib/errorTranslator";
      loadData();
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  // DELETE USER (profile + role only, auth user remains)
import { traducirError } from "@/lib/errorTranslator";
  const deleteUser = async (p: UserProfile) => {
import { traducirError } from "@/lib/errorTranslator";
    if (!confirm(`¿Estás seguro de eliminar a "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
import { traducirError } from "@/lib/errorTranslator";
    const [roleRes, profileRes] = await Promise.all([
import { traducirError } from "@/lib/errorTranslator";
      supabase.from("user_roles").delete().eq("user_id", p.user_id),
import { traducirError } from "@/lib/errorTranslator";
      supabase.from("profiles").delete().eq("user_id", p.user_id),
import { traducirError } from "@/lib/errorTranslator";
    ]);
import { traducirError } from "@/lib/errorTranslator";
    if (profileRes.error) {
import { traducirError } from "@/lib/errorTranslator";
      toast.error(profileRes.error.message);
import { traducirError } from "@/lib/errorTranslator";
    } else {
import { traducirError } from "@/lib/errorTranslator";
      toast.success("Usuario eliminado");
import { traducirError } from "@/lib/errorTranslator";
      await supabase.from("audit_logs").insert({
import { traducirError } from "@/lib/errorTranslator";
        user_id: user!.id, accion: "eliminar_usuario", entidad: "profiles",
import { traducirError } from "@/lib/errorTranslator";
        entidad_id: p.user_id, detalles: { nombre: p.nombre, email: p.email },
import { traducirError } from "@/lib/errorTranslator";
      } as any);
import { traducirError } from "@/lib/errorTranslator";
      loadData();
import { traducirError } from "@/lib/errorTranslator";
    }
import { traducirError } from "@/lib/errorTranslator";
  };
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  if (permLoading || loading) {
import { traducirError } from "@/lib/errorTranslator";
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
import { traducirError } from "@/lib/errorTranslator";
  }
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  if (!isAdmin) {
import { traducirError } from "@/lib/errorTranslator";
    return (
import { traducirError } from "@/lib/errorTranslator";
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
import { traducirError } from "@/lib/errorTranslator";
        <ShieldAlert className="h-12 w-12 mb-4 opacity-40" />
import { traducirError } from "@/lib/errorTranslator";
        <h2 className="text-lg font-semibold text-foreground">Acceso Restringido</h2>
import { traducirError } from "@/lib/errorTranslator";
        <p className="text-sm mt-1">Solo los administradores pueden gestionar usuarios y roles.</p>
import { traducirError } from "@/lib/errorTranslator";
      </div>
import { traducirError } from "@/lib/errorTranslator";
    );
import { traducirError } from "@/lib/errorTranslator";
  }
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
  return (
import { traducirError } from "@/lib/errorTranslator";
    <div className="animate-fade-in space-y-6 max-w-5xl">
import { traducirError } from "@/lib/errorTranslator";
      <div>
import { traducirError } from "@/lib/errorTranslator";
        <h1 className="text-2xl font-bold text-foreground">Usuarios y Roles</h1>
import { traducirError } from "@/lib/errorTranslator";
        <p className="text-muted-foreground">Administra usuarios, asigna roles y revisa la actividad del sistema</p>
import { traducirError } from "@/lib/errorTranslator";
      </div>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
      <Tabs defaultValue="usuarios">
import { traducirError } from "@/lib/errorTranslator";
        <TabsList className="grid grid-cols-3 w-full max-w-md">
import { traducirError } from "@/lib/errorTranslator";
          <TabsTrigger value="usuarios"><Users className="h-4 w-4 mr-1.5" />Usuarios</TabsTrigger>
import { traducirError } from "@/lib/errorTranslator";
          <TabsTrigger value="permisos"><Shield className="h-4 w-4 mr-1.5" />Permisos</TabsTrigger>
import { traducirError } from "@/lib/errorTranslator";
          <TabsTrigger value="auditoria"><History className="h-4 w-4 mr-1.5" />Auditoría</TabsTrigger>
import { traducirError } from "@/lib/errorTranslator";
        </TabsList>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
        {/* ===== TAB USUARIOS ===== */}
import { traducirError } from "@/lib/errorTranslator";
        <TabsContent value="usuarios" className="mt-4">
import { traducirError } from "@/lib/errorTranslator";
          <Card>
import { traducirError } from "@/lib/errorTranslator";
            <CardHeader className="flex flex-row items-center justify-between">
import { traducirError } from "@/lib/errorTranslator";
              <div>
import { traducirError } from "@/lib/errorTranslator";
                <CardTitle className="text-base">Usuarios Registrados</CardTitle>
import { traducirError } from "@/lib/errorTranslator";
                <CardDescription>Crea, edita, desactiva o elimina usuarios del sistema</CardDescription>
import { traducirError } from "@/lib/errorTranslator";
              </div>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
              {/* CREATE MODAL */}
import { traducirError } from "@/lib/errorTranslator";
              <Dialog open={createModal} onOpenChange={setCreateModal}>
import { traducirError } from "@/lib/errorTranslator";
                <DialogTrigger asChild>
import { traducirError } from "@/lib/errorTranslator";
                  <Button size="sm"><UserPlus className="h-4 w-4 mr-2" />Nuevo Usuario</Button>
import { traducirError } from "@/lib/errorTranslator";
                </DialogTrigger>
import { traducirError } from "@/lib/errorTranslator";
                <DialogContent>
import { traducirError } from "@/lib/errorTranslator";
                  <DialogHeader>
import { traducirError } from "@/lib/errorTranslator";
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
import { traducirError } from "@/lib/errorTranslator";
                    <DialogDescription>Genera una nueva cuenta para otro miembro del equipo.</DialogDescription>
import { traducirError } from "@/lib/errorTranslator";
                  </DialogHeader>
import { traducirError } from "@/lib/errorTranslator";
                  <form onSubmit={handleCreateUser} className="space-y-4 py-4">
import { traducirError } from "@/lib/errorTranslator";
                    <div className="flex justify-center">
import { traducirError } from "@/lib/errorTranslator";
                      <label className="relative cursor-pointer group">
import { traducirError } from "@/lib/errorTranslator";
                        <Avatar className="h-20 w-20 border-2 border-dashed border-muted-foreground/40 group-hover:border-primary transition-colors">
import { traducirError } from "@/lib/errorTranslator";
                          {avatarPreview ? <AvatarImage src={avatarPreview} alt="Preview" /> : <AvatarFallback className="bg-muted"><Camera className="h-6 w-6 text-muted-foreground" /></AvatarFallback>}
import { traducirError } from "@/lib/errorTranslator";
                        </Avatar>
import { traducirError } from "@/lib/errorTranslator";
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
import { traducirError } from "@/lib/errorTranslator";
                        <span className="text-[10px] text-muted-foreground block text-center mt-1">Foto</span>
import { traducirError } from "@/lib/errorTranslator";
                      </label>
import { traducirError } from "@/lib/errorTranslator";
                    </div>
import { traducirError } from "@/lib/errorTranslator";
                    <div className="space-y-2"><Label>Nombre Completo</Label><Input value={newUser.nombre} onChange={e => setNewUser({ ...newUser, nombre: e.target.value })} required /></div>
import { traducirError } from "@/lib/errorTranslator";
                    <div className="space-y-2"><Label>Cédula</Label><Input value={newUser.cedula} onChange={e => setNewUser({ ...newUser, cedula: e.target.value })} placeholder="000-0000000-0" required /></div>
import { traducirError } from "@/lib/errorTranslator";
                    <div className="space-y-2"><Label>Correo Electrónico</Label><Input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required /></div>
import { traducirError } from "@/lib/errorTranslator";
                    <div className="space-y-2"><Label>Contraseña (Min. 6 caracteres)</Label><Input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} minLength={6} required /></div>
import { traducirError } from "@/lib/errorTranslator";
                    <div className="space-y-2">
import { traducirError } from "@/lib/errorTranslator";
                      <Label>Rol en el Sistema</Label>
import { traducirError } from "@/lib/errorTranslator";
                      <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as AppRole })}>
import { traducirError } from "@/lib/errorTranslator";
                        <SelectTrigger><SelectValue /></SelectTrigger>
import { traducirError } from "@/lib/errorTranslator";
                        <SelectContent>{Object.entries(ROLE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label} - {v.desc}</SelectItem>)}</SelectContent>
import { traducirError } from "@/lib/errorTranslator";
                      </Select>
import { traducirError } from "@/lib/errorTranslator";
                    </div>
import { traducirError } from "@/lib/errorTranslator";
                    <DialogFooter>
import { traducirError } from "@/lib/errorTranslator";
                      <Button variant="outline" type="button" onClick={() => setCreateModal(false)}>Cancelar</Button>
import { traducirError } from "@/lib/errorTranslator";
                      <Button type="submit" disabled={creating}>{creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Crear Cuenta</Button>
import { traducirError } from "@/lib/errorTranslator";
                    </DialogFooter>
import { traducirError } from "@/lib/errorTranslator";
                  </form>
import { traducirError } from "@/lib/errorTranslator";
                </DialogContent>
import { traducirError } from "@/lib/errorTranslator";
              </Dialog>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
              {/* EDIT MODAL */}
import { traducirError } from "@/lib/errorTranslator";
              <Dialog open={editModal} onOpenChange={setEditModal}>
import { traducirError } from "@/lib/errorTranslator";
                <DialogContent>
import { traducirError } from "@/lib/errorTranslator";
                  <DialogHeader>
import { traducirError } from "@/lib/errorTranslator";
                    <DialogTitle>Editar Usuario</DialogTitle>
import { traducirError } from "@/lib/errorTranslator";
                    <DialogDescription>Actualiza la información del usuario.</DialogDescription>
import { traducirError } from "@/lib/errorTranslator";
                  </DialogHeader>
import { traducirError } from "@/lib/errorTranslator";
                  <form onSubmit={handleEditUser} className="space-y-4 py-4">
import { traducirError } from "@/lib/errorTranslator";
                    <div className="flex justify-center">
import { traducirError } from "@/lib/errorTranslator";
                      <label className="relative cursor-pointer group">
import { traducirError } from "@/lib/errorTranslator";
                        <Avatar className="h-20 w-20 border-2 border-dashed border-muted-foreground/40 group-hover:border-primary transition-colors">
import { traducirError } from "@/lib/errorTranslator";
                          {editAvatarPreview ? <AvatarImage src={editAvatarPreview} alt="Preview" /> : <AvatarFallback className="bg-muted"><Camera className="h-6 w-6 text-muted-foreground" /></AvatarFallback>}
import { traducirError } from "@/lib/errorTranslator";
                        </Avatar>
import { traducirError } from "@/lib/errorTranslator";
                        <input type="file" accept="image/*" className="hidden" onChange={handleEditAvatarChange} />
import { traducirError } from "@/lib/errorTranslator";
                        <span className="text-[10px] text-muted-foreground block text-center mt-1">Cambiar foto</span>
import { traducirError } from "@/lib/errorTranslator";
                      </label>
import { traducirError } from "@/lib/errorTranslator";
                    </div>
import { traducirError } from "@/lib/errorTranslator";
                    <div className="space-y-2"><Label>Nombre Completo</Label><Input value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })} required /></div>
import { traducirError } from "@/lib/errorTranslator";
                    <div className="space-y-2"><Label>Cédula</Label><Input value={editForm.cedula} onChange={e => setEditForm({ ...editForm, cedula: e.target.value })} placeholder="000-0000000-0" /></div>
import { traducirError } from "@/lib/errorTranslator";
                    <div className="space-y-2"><Label>Correo Electrónico</Label><Input type="email" value={editForm.email} disabled className="opacity-60" /></div>
import { traducirError } from "@/lib/errorTranslator";
                    <DialogFooter>
import { traducirError } from "@/lib/errorTranslator";
                      <Button variant="outline" type="button" onClick={() => setEditModal(false)}>Cancelar</Button>
import { traducirError } from "@/lib/errorTranslator";
                      <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Guardar Cambios</Button>
import { traducirError } from "@/lib/errorTranslator";
                    </DialogFooter>
import { traducirError } from "@/lib/errorTranslator";
                  </form>
import { traducirError } from "@/lib/errorTranslator";
                </DialogContent>
import { traducirError } from "@/lib/errorTranslator";
              </Dialog>
import { traducirError } from "@/lib/errorTranslator";
            </CardHeader>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
            <CardContent>
import { traducirError } from "@/lib/errorTranslator";
              <Table>
import { traducirError } from "@/lib/errorTranslator";
                <TableHeader>
import { traducirError } from "@/lib/errorTranslator";
                  <TableRow>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead>Usuario</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead>Email / Cédula</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead>Estado</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead>Rol</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead>Fecha Registro</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead>Fecha Desactivación</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead className="text-right">Acciones</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                  </TableRow>
import { traducirError } from "@/lib/errorTranslator";
                </TableHeader>
import { traducirError } from "@/lib/errorTranslator";
                <TableBody>
import { traducirError } from "@/lib/errorTranslator";
                  {profiles.map(p => {
import { traducirError } from "@/lib/errorTranslator";
                    const currentRole = getRoleForUser(p.user_id);
import { traducirError } from "@/lib/errorTranslator";
                    const hasPending = !!pendingChanges[p.user_id];
import { traducirError } from "@/lib/errorTranslator";
                    const isCurrentUser = p.user_id === user?.id;
import { traducirError } from "@/lib/errorTranslator";
                    const isActive = p.activo ?? true;
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
                    return (
import { traducirError } from "@/lib/errorTranslator";
                      <TableRow key={p.id} className={!isActive ? "opacity-50" : ""}>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                          <div className="flex items-center gap-2">
import { traducirError } from "@/lib/errorTranslator";
                            <Avatar className="h-8 w-8">
import { traducirError } from "@/lib/errorTranslator";
                              {(p as any).avatar_url ? <AvatarImage src={(p as any).avatar_url} /> : <AvatarFallback className="text-xs bg-muted">{(p.nombre || "?")[0].toUpperCase()}</AvatarFallback>}
import { traducirError } from "@/lib/errorTranslator";
                            </Avatar>
import { traducirError } from "@/lib/errorTranslator";
                            <div>
import { traducirError } from "@/lib/errorTranslator";
                              <span className="font-medium text-sm">{p.nombre || "—"}</span>
import { traducirError } from "@/lib/errorTranslator";
                              {isCurrentUser && <Badge variant="outline" className="ml-2 text-[10px]">Tú</Badge>}
import { traducirError } from "@/lib/errorTranslator";
                            </div>
import { traducirError } from "@/lib/errorTranslator";
                          </div>
import { traducirError } from "@/lib/errorTranslator";
                        </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                          <div className="text-sm text-muted-foreground">{p.email || "—"}</div>
import { traducirError } from "@/lib/errorTranslator";
                          {(p as any).cedula && <div className="text-xs text-muted-foreground">Céd: {(p as any).cedula}</div>}
import { traducirError } from "@/lib/errorTranslator";
                        </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                          {isActive
import { traducirError } from "@/lib/errorTranslator";
                            ? <Badge variant="default" className="text-[10px]">Activo</Badge>
import { traducirError } from "@/lib/errorTranslator";
                            : <Badge variant="destructive" className="text-[10px]">Inactivo</Badge>
import { traducirError } from "@/lib/errorTranslator";
                          }
import { traducirError } from "@/lib/errorTranslator";
                        </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell>
import { traducirError } from "@/lib/errorTranslator";
                          <div className="flex items-center gap-1">
import { traducirError } from "@/lib/errorTranslator";
                            <Select value={currentRole} onValueChange={(v) => handleRoleChange(p.user_id, v as AppRole)} disabled={isCurrentUser}>
import { traducirError } from "@/lib/errorTranslator";
                              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
import { traducirError } from "@/lib/errorTranslator";
                              <SelectContent>{Object.entries(ROLE_CONFIG).map(([key, val]) => <SelectItem key={key} value={key}>{val.label}</SelectItem>)}</SelectContent>
import { traducirError } from "@/lib/errorTranslator";
                            </Select>
import { traducirError } from "@/lib/errorTranslator";
                            {hasPending && (
import { traducirError } from "@/lib/errorTranslator";
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveRole(p.user_id)}>
import { traducirError } from "@/lib/errorTranslator";
                                <Save className="h-3.5 w-3.5" />
import { traducirError } from "@/lib/errorTranslator";
                              </Button>
import { traducirError } from "@/lib/errorTranslator";
                            )}
import { traducirError } from "@/lib/errorTranslator";
                          </div>
import { traducirError } from "@/lib/errorTranslator";
                        </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
import { traducirError } from "@/lib/errorTranslator";
                          {new Date(p.created_at).toLocaleDateString("es-DO")}
import { traducirError } from "@/lib/errorTranslator";
                        </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
import { traducirError } from "@/lib/errorTranslator";
                          {p.fecha_desactivacion ? new Date(p.fecha_desactivacion).toLocaleDateString("es-DO") : "—"}
import { traducirError } from "@/lib/errorTranslator";
                        </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell className="text-right">
import { traducirError } from "@/lib/errorTranslator";
                          {!isCurrentUser && (
import { traducirError } from "@/lib/errorTranslator";
                            <DropdownMenu>
import { traducirError } from "@/lib/errorTranslator";
                              <DropdownMenuTrigger asChild>
import { traducirError } from "@/lib/errorTranslator";
                                <Button variant="ghost" size="icon" className="h-8 w-8">
import { traducirError } from "@/lib/errorTranslator";
                                  <MoreHorizontal className="h-4 w-4" />
import { traducirError } from "@/lib/errorTranslator";
                                </Button>
import { traducirError } from "@/lib/errorTranslator";
                              </DropdownMenuTrigger>
import { traducirError } from "@/lib/errorTranslator";
                              <DropdownMenuContent align="end">
import { traducirError } from "@/lib/errorTranslator";
                                <DropdownMenuItem onClick={() => openEditModal(p)}>
import { traducirError } from "@/lib/errorTranslator";
                                  <Pencil className="h-3.5 w-3.5 mr-2" />Editar
import { traducirError } from "@/lib/errorTranslator";
                                </DropdownMenuItem>
import { traducirError } from "@/lib/errorTranslator";
                                <DropdownMenuItem onClick={() => toggleUserActive(p)}>
import { traducirError } from "@/lib/errorTranslator";
                                  {isActive
import { traducirError } from "@/lib/errorTranslator";
                                    ? <><UserX className="h-3.5 w-3.5 mr-2" />Desactivar</>
import { traducirError } from "@/lib/errorTranslator";
                                    : <><UserCheck className="h-3.5 w-3.5 mr-2" />Reactivar</>
import { traducirError } from "@/lib/errorTranslator";
                                  }
import { traducirError } from "@/lib/errorTranslator";
                                </DropdownMenuItem>
import { traducirError } from "@/lib/errorTranslator";
                                <DropdownMenuSeparator />
import { traducirError } from "@/lib/errorTranslator";
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteUser(p)}>
import { traducirError } from "@/lib/errorTranslator";
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />Eliminar
import { traducirError } from "@/lib/errorTranslator";
                                </DropdownMenuItem>
import { traducirError } from "@/lib/errorTranslator";
                              </DropdownMenuContent>
import { traducirError } from "@/lib/errorTranslator";
                            </DropdownMenu>
import { traducirError } from "@/lib/errorTranslator";
                          )}
import { traducirError } from "@/lib/errorTranslator";
                        </TableCell>
import { traducirError } from "@/lib/errorTranslator";
                      </TableRow>
import { traducirError } from "@/lib/errorTranslator";
                    );
import { traducirError } from "@/lib/errorTranslator";
                  })}
import { traducirError } from "@/lib/errorTranslator";
                </TableBody>
import { traducirError } from "@/lib/errorTranslator";
              </Table>
import { traducirError } from "@/lib/errorTranslator";
              {profiles.length === 0 && (
import { traducirError } from "@/lib/errorTranslator";
                <p className="text-center py-8 text-sm text-muted-foreground">No hay usuarios registrados</p>
import { traducirError } from "@/lib/errorTranslator";
              )}
import { traducirError } from "@/lib/errorTranslator";
            </CardContent>
import { traducirError } from "@/lib/errorTranslator";
          </Card>
import { traducirError } from "@/lib/errorTranslator";
        </TabsContent>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
        {/* ===== TAB PERMISOS ===== */}
import { traducirError } from "@/lib/errorTranslator";
        <TabsContent value="permisos" className="mt-4">
import { traducirError } from "@/lib/errorTranslator";
          <Card>
import { traducirError } from "@/lib/errorTranslator";
            <CardHeader>
import { traducirError } from "@/lib/errorTranslator";
              <CardTitle className="text-base">Matriz de Permisos por Rol</CardTitle>
import { traducirError } from "@/lib/errorTranslator";
              <CardDescription>Vista general de permisos asignados a cada rol</CardDescription>
import { traducirError } from "@/lib/errorTranslator";
            </CardHeader>
import { traducirError } from "@/lib/errorTranslator";
            <CardContent>
import { traducirError } from "@/lib/errorTranslator";
              <Table>
import { traducirError } from "@/lib/errorTranslator";
                <TableHeader>
import { traducirError } from "@/lib/errorTranslator";
                  <TableRow>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead>Permiso</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead className="text-center"><div className="flex items-center justify-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Admin</div></TableHead>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead className="text-center">Cajero</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                    <TableHead className="text-center">Contador</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                  </TableRow>
import { traducirError } from "@/lib/errorTranslator";
                </TableHeader>
import { traducirError } from "@/lib/errorTranslator";
                <TableBody>
import { traducirError } from "@/lib/errorTranslator";
                  {PERMISSION_MATRIX.map(row => (
import { traducirError } from "@/lib/errorTranslator";
                    <TableRow key={row.permission}>
import { traducirError } from "@/lib/errorTranslator";
                      <TableCell className="font-medium text-sm">{row.permission}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                      <TableCell className="text-center">{row.admin ? "✅" : "❌"}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                      <TableCell className="text-center">{row.cajero ? "✅" : "❌"}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                      <TableCell className="text-center">{row.contador ? "✅" : "❌"}</TableCell>
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
        </TabsContent>
import { traducirError } from "@/lib/errorTranslator";

import { traducirError } from "@/lib/errorTranslator";
        {/* ===== TAB AUDITORÍA ===== */}
import { traducirError } from "@/lib/errorTranslator";
        <TabsContent value="auditoria" className="mt-4">
import { traducirError } from "@/lib/errorTranslator";
          <Card>
import { traducirError } from "@/lib/errorTranslator";
            <CardHeader>
import { traducirError } from "@/lib/errorTranslator";
              <CardTitle className="text-base">Registro de Actividad</CardTitle>
import { traducirError } from "@/lib/errorTranslator";
              <CardDescription>Últimas 50 acciones registradas en el sistema</CardDescription>
import { traducirError } from "@/lib/errorTranslator";
            </CardHeader>
import { traducirError } from "@/lib/errorTranslator";
            <CardContent>
import { traducirError } from "@/lib/errorTranslator";
              <ScrollArea className="max-h-[500px]">
import { traducirError } from "@/lib/errorTranslator";
                <Table>
import { traducirError } from "@/lib/errorTranslator";
                  <TableHeader>
import { traducirError } from "@/lib/errorTranslator";
                    <TableRow>
import { traducirError } from "@/lib/errorTranslator";
                      <TableHead>Fecha</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                      <TableHead>Usuario</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                      <TableHead>Acción</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                      <TableHead>Entidad</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                      <TableHead>Detalles</TableHead>
import { traducirError } from "@/lib/errorTranslator";
                    </TableRow>
import { traducirError } from "@/lib/errorTranslator";
                  </TableHeader>
import { traducirError } from "@/lib/errorTranslator";
                  <TableBody>
import { traducirError } from "@/lib/errorTranslator";
                    {logs.map(log => (
import { traducirError } from "@/lib/errorTranslator";
                      <TableRow key={log.id}>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleString("es-DO")}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell className="text-sm">{getProfileName(log.user_id)}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell><Badge variant="outline" className="text-xs">{log.accion}</Badge></TableCell>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell className="text-sm">{log.entidad}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                        <TableCell className="text-xs text-muted-foreground max-w-48 truncate">{log.detalles ? JSON.stringify(log.detalles) : "—"}</TableCell>
import { traducirError } from "@/lib/errorTranslator";
                      </TableRow>
import { traducirError } from "@/lib/errorTranslator";
                    ))}
import { traducirError } from "@/lib/errorTranslator";
                    {logs.length === 0 && (
import { traducirError } from "@/lib/errorTranslator";
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay registros de actividad</TableCell></TableRow>
import { traducirError } from "@/lib/errorTranslator";
                    )}
import { traducirError } from "@/lib/errorTranslator";
                  </TableBody>
import { traducirError } from "@/lib/errorTranslator";
                </Table>
import { traducirError } from "@/lib/errorTranslator";
              </ScrollArea>
import { traducirError } from "@/lib/errorTranslator";
            </CardContent>
import { traducirError } from "@/lib/errorTranslator";
          </Card>
import { traducirError } from "@/lib/errorTranslator";
        </TabsContent>
import { traducirError } from "@/lib/errorTranslator";
      </Tabs>
import { traducirError } from "@/lib/errorTranslator";
    </div>
import { traducirError } from "@/lib/errorTranslator";
  );
import { traducirError } from "@/lib/errorTranslator";
