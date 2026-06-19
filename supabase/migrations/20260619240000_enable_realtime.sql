-- Habilitar Realtime en las tablas que alimentan el Dashboard para que la
-- suscripción postgres_changes del frontend reciba eventos. Por defecto
-- Supabase solo publica la tabla auth; hay que añadir las de la app a la
-- publicación supabase_realtime.
--
-- Realtime respeta RLS: cada usuario solo recibe eventos de las filas que
-- sus policies le permiten ver (aislamiento por user_id).
--
-- ADD TABLE sobre una tabla ya miembro solo emite NOTICE (no error) en PG 15+,
-- así que la migración es segura de re-aplicar.

ALTER PUBLICATION supabase_realtime ADD TABLE
  public.facturas,
  public.detalle_facturas,
  public.clientes,
  public.productos;