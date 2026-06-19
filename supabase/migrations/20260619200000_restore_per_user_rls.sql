-- ============================================================================
-- Restaurar aislamiento por usuario (multi-tenant seguro)
-- ----------------------------------------------------------------------------
-- Revierte 20260305220000_update_rls.sql y políticas permisivas posteriores
-- que permitían a CUALQUIER usuario autenticado leer/editar/borrar los datos de
-- otras empresas. También elimina los "bypass de admin" (has_role('admin'))
-- que dejaban que el admin de una empresa viera/manejara los datos de otra.
--
-- Modelo actual: 1 usuario = 1 negocio (cada signup es owner de sus propios
-- datos). El soporte de varios usuarios compartiendo un mismo negocio
-- (cajeros subordinados a un admin) requiere una migración empresa_id que
-- aún no existe; mientras tanto el aislamiento estricto por user_id es la
-- opción segura. La gestión de usuarios/roles se mueve a edge function con
-- service_role (ver migración/edge function correspondiente).
-- ============================================================================

-- ===================== PROFILES =====================
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- El listado de perfiles para el panel de usuarios se hace vía edge function.

-- ===================== USER_ROLES =====================
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
-- INSERT/UPDATE/DELETE de roles: solo vía service_role (edge function de
-- administración de usuarios). Ninguna policy FOR INSERT/UPDATE/DELETE para
-- authenticated => denegado por defecto.

-- ===================== CATEGORIAS =====================
DROP POLICY IF EXISTS "Users can CRUD categorias" ON public.categorias;
DROP POLICY IF EXISTS "All authenticated can view categorias" ON public.categorias;
DROP POLICY IF EXISTS "Users can CRUD own categorias" ON public.categorias;
CREATE POLICY "Users can CRUD own categorias" ON public.categorias
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===================== CLIENTES =====================
DROP POLICY IF EXISTS "Users can CRUD clientes" ON public.clientes;
DROP POLICY IF EXISTS "All authenticated can view clientes" ON public.clientes;
DROP POLICY IF EXISTS "Users can CRUD own clientes" ON public.clientes;
CREATE POLICY "Users can CRUD own clientes" ON public.clientes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===================== PRODUCTOS =====================
DROP POLICY IF EXISTS "Users can CRUD productos" ON public.productos;
DROP POLICY IF EXISTS "All authenticated can view productos" ON public.productos;
DROP POLICY IF EXISTS "Users can CRUD own productos" ON public.productos;
CREATE POLICY "Users can CRUD own productos" ON public.productos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===================== PROVEEDORES =====================
DROP POLICY IF EXISTS "Users can CRUD proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Users can CRUD own proveedores" ON public.proveedores;
CREATE POLICY "Users can CRUD own proveedores" ON public.proveedores
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===================== FACTURAS =====================
DROP POLICY IF EXISTS "Users can CRUD facturas" ON public.facturas;
DROP POLICY IF EXISTS "Users can CRUD own facturas" ON public.facturas;
CREATE POLICY "Users can CRUD own facturas" ON public.facturas
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===================== DETALLE FACTURAS (via propiedad de la factura) =====================
DROP POLICY IF EXISTS "Users can manage detalle_facturas" ON public.detalle_facturas;
DROP POLICY IF EXISTS "Users can manage own detalle_facturas" ON public.detalle_facturas;
CREATE POLICY "Users can manage own detalle_facturas" ON public.detalle_facturas
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.facturas f
                 WHERE f.id = detalle_facturas.factura_id AND f.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.facturas f
                      WHERE f.id = detalle_facturas.factura_id AND f.user_id = auth.uid()));

-- ===================== COMPRAS =====================
DROP POLICY IF EXISTS "Users can CRUD compras" ON public.compras;
DROP POLICY IF EXISTS "Users can CRUD own compras" ON public.compras;
CREATE POLICY "Users can CRUD own compras" ON public.compras
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===================== DETALLE COMPRAS (via propiedad de la compra) =====================
DROP POLICY IF EXISTS "Users can manage detalle_compras" ON public.detalle_compras;
DROP POLICY IF EXISTS "Users can manage own detalle_compras" ON public.detalle_compras;
CREATE POLICY "Users can manage own detalle_compras" ON public.detalle_compras
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.compras c
                 WHERE c.id = detalle_compras.compra_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.compras c
                      WHERE c.id = detalle_compras.compra_id AND c.user_id = auth.uid()));

-- ===================== CONFIGURACION NEGOCIO =====================
DROP POLICY IF EXISTS "Users can CRUD config" ON public.configuracion_negocio;
DROP POLICY IF EXISTS "All authenticated can view config" ON public.configuracion_negocio;
DROP POLICY IF EXISTS "Users can CRUD own config" ON public.configuracion_negocio;
CREATE POLICY "Users can CRUD own config" ON public.configuracion_negocio
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===================== NCF SECUENCIAS =====================
DROP POLICY IF EXISTS "Users can CRUD ncf" ON public.ncf_secuencias;
DROP POLICY IF EXISTS "Users can CRUD own ncf" ON public.ncf_secuencias;
CREATE POLICY "Users can CRUD own ncf" ON public.ncf_secuencias
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===================== ORDENES SERVICIO =====================
DROP POLICY IF EXISTS "Users can CRUD ordenes" ON public.ordenes_servicio;
DROP POLICY IF EXISTS "Users can CRUD own ordenes_servicio" ON public.ordenes_servicio;
CREATE POLICY "Users can CRUD own ordenes_servicio" ON public.ordenes_servicio
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===================== PAGOS FACTURA =====================
DROP POLICY IF EXISTS "Users can CRUD own pagos_factura" ON public.pagos_factura;
CREATE POLICY "Users can CRUD own pagos_factura" ON public.pagos_factura
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===================== MOVIMIENTOS INVENTARIO (usuario_id) =====================
DROP POLICY IF EXISTS "Authenticated can view movimientos" ON public.movimientos_inventario;
DROP POLICY IF EXISTS "Users can view own movimientos" ON public.movimientos_inventario;
DROP POLICY IF EXISTS "Authenticated can insert movimientos" ON public.movimientos_inventario;
DROP POLICY IF EXISTS "Users can insert own movimientos" ON public.movimientos_inventario;
CREATE POLICY "Users can view own movimientos" ON public.movimientos_inventario
  FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can insert own movimientos" ON public.movimientos_inventario
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- ===================== NOTAS CREDITO (usuario_id) =====================
-- Se elimina el bypass has_role('admin') que exponía notas de otras empresas.
DROP POLICY IF EXISTS "Users can view own notas_credito" ON public.notas_credito;
DROP POLICY IF EXISTS "Authenticated can insert notas_credito" ON public.notas_credito;
DROP POLICY IF EXISTS "Users can insert own notas_credito" ON public.notas_credito;
DROP POLICY IF EXISTS "Users can update own notas_credito" ON public.notas_credito;
DROP POLICY IF EXISTS "Users can delete own notas_credito" ON public.notas_credito;
CREATE POLICY "Users can view own notas_credito" ON public.notas_credito
  FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "Users can insert own notas_credito" ON public.notas_credito
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can update own notas_credito" ON public.notas_credito
  FOR UPDATE USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Users can delete own notas_credito" ON public.notas_credito
  FOR DELETE USING (auth.uid() = usuario_id);

-- ===================== DETALLE NOTAS CREDITO (via propiedad de la nota) =====================
DROP POLICY IF EXISTS "Users can view own detalle_notas_credito" ON public.detalle_notas_credito;
DROP POLICY IF EXISTS "Authenticated can insert detalle_notas_credito" ON public.detalle_notas_credito;
DROP POLICY IF EXISTS "Users can insert own detalle_notas_credito" ON public.detalle_notas_credito;
CREATE POLICY "Users can view own detalle_notas_credito" ON public.detalle_notas_credito
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.notas_credito nc
    WHERE nc.id = detalle_notas_credito.nota_credito_id AND nc.usuario_id = auth.uid()
  ));
CREATE POLICY "Users can insert own detalle_notas_credito" ON public.detalle_notas_credito
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.notas_credito nc
    WHERE nc.id = detalle_notas_credito.nota_credito_id AND nc.usuario_id = auth.uid()
  ));

-- ===================== AUDIT LOGS =====================
-- Solo el propio usuario lee sus logs. INSERT solo del propio usuario.
-- DELETE: NINGUNA policy para authenticated => no se pueden borrar logs
-- desde el cliente (anti-borrado de huellas). Solo service_role puede purgar.
DROP POLICY IF EXISTS "Users can CRUD logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view own logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view all logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated can insert logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.audit_logs;
CREATE POLICY "Users can view own logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Nota: para que los admins vean logs de su negocio en un modelo multi-usuario
-- se requerirá empresa_id + policy por empresa. Por ahora, logs son por usuario.

-- ===================== STORAGE: avatars (scope por carpeta del owner) =====================
-- Antes: cualquier autenticado podía sobrescribir/borrar el avatar de otro.
-- Ahora: solo el dueño de la carpeta {uid}/ puede actualizar/borrar.
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
CREATE POLICY "Users can update own avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own avatars" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
-- IMPORTANTE: el INSERT de avatars ("Authenticated users can upload avatars") sigue
-- sin scoping por carpeta; se recomienda que el frontend suba a {uid}/<archivo>
-- y agregar aquí el mismo check de carpeta una vez confirmado el path de subida.