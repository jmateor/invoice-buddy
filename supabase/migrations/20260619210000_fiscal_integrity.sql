-- ============================================================================
-- Integridad fiscal: unicidad de NCF/e-NCF, validaciones de formato y montos,
-- y conversión de ON DELETE CASCADE → RESTRICT en tablas fiscales.
--
-- Los CHECK se crean con NOT VALID para no fallar la migración si hay filas
-- históricas que no cumplan: solo se validarán en INSERT/UPDATE futuros.
-- Recomendado ejecutar luego: ALTER TABLE ... VALIDATE CONSTRAINT ... ;
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. ON DELETE RESTRICT: borrar un usuario NO debe borrar sus facturas/compras/
--    maestros (la DGII exige conservar comprobantes). Antes era CASCADE.
--    Solo aplica a las 6 tablas que tenían FK real a auth.users con CASCADE.
-- --------------------------------------------------------------------------
ALTER TABLE public.facturas DROP CONSTRAINT IF EXISTS facturas_user_id_fkey;
ALTER TABLE public.facturas ADD CONSTRAINT facturas_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE public.compras DROP CONSTRAINT IF EXISTS compras_user_id_fkey;
ALTER TABLE public.compras ADD CONSTRAINT compras_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE public.clientes DROP CONSTRAINT IF EXISTS clientes_user_id_fkey;
ALTER TABLE public.clientes ADD CONSTRAINT clientes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE public.productos DROP CONSTRAINT IF EXISTS productos_user_id_fkey;
ALTER TABLE public.productos ADD CONSTRAINT productos_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE public.categorias DROP CONSTRAINT IF EXISTS categorias_user_id_fkey;
ALTER TABLE public.categorias ADD CONSTRAINT categorias_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

ALTER TABLE public.proveedores DROP CONSTRAINT IF EXISTS proveedores_user_id_fkey;
ALTER TABLE public.proveedores ADD CONSTRAINT proveedores_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

-- ecf_documentos: impedir borrar una factura/nota que ya tiene e-CF emitido.
ALTER TABLE public.ecf_documentos DROP CONSTRAINT IF EXISTS ecf_documentos_factura_id_fkey;
ALTER TABLE public.ecf_documentos ADD CONSTRAINT ecf_documentos_factura_id_fkey
  FOREIGN KEY (factura_id) REFERENCES public.facturas(id) ON DELETE RESTRICT;
ALTER TABLE public.ecf_documentos DROP CONSTRAINT IF EXISTS ecf_documentos_nota_credito_id_fkey;
ALTER TABLE public.ecf_documentos ADD CONSTRAINT ecf_documentos_nota_credito_id_fkey
  FOREIGN KEY (nota_credito_id) REFERENCES public.notas_credito(id) ON DELETE RESTRICT;

-- --------------------------------------------------------------------------
-- 2. Unicidad de NCF y e-NCF. Si existen duplicados históricos, esta creación
--    fallará; en ese caso, depurar duplicados antes de aplicar.
--    (Comando de diagnóstico: SELECT user_id, ncf, count(*) FROM public.facturas
--     WHERE ncf <> '' GROUP BY 1,2 HAVING count(*) > 1;)
-- --------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_facturas_user_ncf
  ON public.facturas(user_id, ncf) WHERE ncf <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_ecf_documentos_user_encf
  ON public.ecf_documentos(user_id, encf);

-- Índices de búsqueda faltantes
CREATE INDEX IF NOT EXISTS idx_clientes_rnc ON public.clientes(user_id, rnc_cedula);
CREATE INDEX IF NOT EXISTS idx_proveedores_rnc ON public.proveedores(user_id, rnc);
CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON public.movimientos_inventario(producto_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notas_credito_factura ON public.notas_credito(factura_id);
CREATE INDEX IF NOT EXISTS idx_pagos_factura_factura ON public.pagos_factura(factura_id);

-- --------------------------------------------------------------------------
-- 3. CHECK de formato NCF / e-NCF (NOT VALID: solo aplica a nuevas filas)
-- --------------------------------------------------------------------------
ALTER TABLE public.facturas ADD CONSTRAINT facturas_ncf_formato
  CHECK (ncf = '' OR ncf ~ '^[A-Za-z][0-9]{10}$' OR ncf ~ '^[A-Za-z][0-9]{12}$') NOT VALID;

ALTER TABLE public.ecf_documentos ADD CONSTRAINT ecf_documentos_encf_formato
  CHECK (encf ~ '^E[0-9]{12}$') NOT VALID;

-- --------------------------------------------------------------------------
-- 4. CHECK montos >= 0 y cantidad > 0 (NOT VALID)
-- --------------------------------------------------------------------------
ALTER TABLE public.facturas ADD CONSTRAINT facturas_total_positivo CHECK (total >= 0) NOT VALID;
ALTER TABLE public.facturas ADD CONSTRAINT facturas_subtotal_positivo CHECK (subtotal >= 0) NOT VALID;
ALTER TABLE public.facturas ADD CONSTRAINT facturas_itbis_positivo CHECK (itbis >= 0) NOT VALID;
ALTER TABLE public.facturas ADD CONSTRAINT facturas_descuento_positivo CHECK (descuento >= 0) NOT VALID;
ALTER TABLE public.detalle_facturas ADD CONSTRAINT detalle_fact_cantidad_positiva CHECK (cantidad > 0) NOT VALID;
ALTER TABLE public.detalle_facturas ADD CONSTRAINT detalle_fact_precio_positivo CHECK (precio_unitario >= 0) NOT VALID;
ALTER TABLE public.compras ADD CONSTRAINT compras_total_positivo CHECK (total >= 0) NOT VALID;
ALTER TABLE public.notas_credito ADD CONSTRAINT notas_credito_total_positivo CHECK (total >= 0) NOT VALID;
ALTER TABLE public.ecf_documentos ADD CONSTRAINT ecf_monto_total_positivo CHECK (monto_total >= 0) NOT VALID;
ALTER TABLE public.ecf_documentos ADD CONSTRAINT ecf_monto_itbis_positivo CHECK (monto_itbis >= 0) NOT VALID;

-- --------------------------------------------------------------------------
-- 5. Validación de RNC/Cédula (9 u 11 dígitos) (NOT VALID)
-- --------------------------------------------------------------------------
ALTER TABLE public.clientes ADD CONSTRAINT clientes_rnc_formato
  CHECK (rnc_cedula IS NULL OR rnc_cedula = '' OR rnc_cedula ~ '^[0-9]{9}$' OR rnc_cedula ~ '^[0-9]{11}$') NOT VALID;
ALTER TABLE public.proveedores ADD CONSTRAINT proveedores_rnc_formato
  CHECK (rnc IS NULL OR rnc = '' OR rnc ~ '^[0-9]{9}$' OR rnc ~ '^[0-9]{11}$') NOT VALID;
ALTER TABLE public.configuracion_negocio ADD CONSTRAINT config_rnc_formato
  CHECK (rnc IS NULL OR rnc = '' OR rnc ~ '^[0-9]{9}$' OR rnc ~ '^[0-9]{11}$') NOT VALID;
ALTER TABLE public.ecf_configuracion ADD CONSTRAINT ecf_config_rnc_formato
  CHECK (rnc ~ '^[0-9]{9}$' OR rnc ~ '^[0-9]{11}$') NOT VALID;