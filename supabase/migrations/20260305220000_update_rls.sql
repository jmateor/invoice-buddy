-- Actualizar políticas RLS para permitir que todos los usuarios autenticados (cajeros, etc.) vean los datos del negocio
-- Esto asume que la base de datos es para uso de una sola empresa o negocio.

-- Profiles: todos los autenticados pueden ver los perfiles (para ver nombres en las tablas)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

-- User roles: todos los autenticados pueden ver roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT USING (auth.role() = 'authenticated');

-- Categorias
DROP POLICY IF EXISTS "Users can CRUD own categorias" ON public.categorias;
CREATE POLICY "Users can CRUD categorias" ON public.categorias FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Clientes
DROP POLICY IF EXISTS "Users can CRUD own clientes" ON public.clientes;
CREATE POLICY "Users can CRUD clientes" ON public.clientes FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Productos
DROP POLICY IF EXISTS "Users can CRUD own productos" ON public.productos;
CREATE POLICY "Users can CRUD productos" ON public.productos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Proveedores
DROP POLICY IF EXISTS "Users can CRUD own proveedores" ON public.proveedores;
CREATE POLICY "Users can CRUD proveedores" ON public.proveedores FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Facturas
DROP POLICY IF EXISTS "Users can CRUD own facturas" ON public.facturas;
CREATE POLICY "Users can CRUD facturas" ON public.facturas FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Detalle facturas
DROP POLICY IF EXISTS "Users can manage own detalle_facturas" ON public.detalle_facturas;
CREATE POLICY "Users can manage detalle_facturas" ON public.detalle_facturas FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Compras
DROP POLICY IF EXISTS "Users can CRUD own compras" ON public.compras;
CREATE POLICY "Users can CRUD compras" ON public.compras FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Detalle compras
DROP POLICY IF EXISTS "Users can manage own detalle_compras" ON public.detalle_compras;
CREATE POLICY "Users can manage detalle_compras" ON public.detalle_compras FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Configuración de negocio
DROP POLICY IF EXISTS "Users can CRUD own config" ON public.configuracion_negocio;
CREATE POLICY "Users can CRUD config" ON public.configuracion_negocio FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- NCF Secuencias
DROP POLICY IF EXISTS "Users can CRUD own ncf" ON public.ncf_secuencias;
CREATE POLICY "Users can CRUD ncf" ON public.ncf_secuencias FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Ordenes servicio
DROP POLICY IF EXISTS "Users can CRUD own ordenes" ON public.ordenes_servicio;
CREATE POLICY "Users can CRUD ordenes" ON public.ordenes_servicio FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Audit Logs
-- Todos los autenticados pueden crear logs, los admins pueden verlos (ya está implementado a nivel de vista)
DROP POLICY IF EXISTS "Users can view own logs" ON public.audit_logs;
CREATE POLICY "Users can CRUD logs" ON public.audit_logs FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
