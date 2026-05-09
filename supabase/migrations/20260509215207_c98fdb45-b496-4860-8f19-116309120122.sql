
-- ============ COMPRAS: ampliar con campos DGII 606 ============
ALTER TABLE public.compras
  ADD COLUMN IF NOT EXISTS ncf text,
  ADD COLUMN IF NOT EXISTS ncf_modificado text,
  ADD COLUMN IF NOT EXISTS tipo_bienes_servicios text DEFAULT '09',
  ADD COLUMN IF NOT EXISTS fecha_pago date,
  ADD COLUMN IF NOT EXISTS monto_servicios numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_bienes numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS itbis_facturado numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS itbis_retenido numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS itbis_proporcionalidad numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS itbis_costo numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS itbis_percibido numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tipo_retencion_isr text,
  ADD COLUMN IF NOT EXISTS monto_retencion_isr numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS isr_percibido numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS isc numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otros_impuestos numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS propina_legal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forma_pago text NOT NULL DEFAULT '1';

-- ============ FACTURAS: ampliar con campos DGII 607/608 ============
ALTER TABLE public.facturas
  ADD COLUMN IF NOT EXISTS tipo_ingreso text NOT NULL DEFAULT '01',
  ADD COLUMN IF NOT EXISTS ncf_modificado text,
  ADD COLUMN IF NOT EXISTS fecha_retencion date,
  ADD COLUMN IF NOT EXISTS itbis_retenido_terceros numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retencion_isr_terceros numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS itbis_percibido numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS isr_percibido numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS isc numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS otros_impuestos numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS propina_legal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_efectivo numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_cheque numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_tarjeta numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_credito numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_bonos numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_permuta numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monto_otros numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS motivo_anulacion text,
  ADD COLUMN IF NOT EXISTS fecha_anulacion timestamptz;

-- ============ PERÍODOS REMITIDOS A DGII ============
CREATE TABLE IF NOT EXISTS public.dgii_periodos_remitidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  periodo text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('606','607','608')),
  cantidad_registros integer NOT NULL DEFAULT 0,
  total_monto numeric NOT NULL DEFAULT 0,
  total_itbis numeric NOT NULL DEFAULT 0,
  archivo_txt_path text,
  archivo_excel_path text,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','generado','enviado','aceptado','rechazado')),
  fecha_generacion timestamptz,
  fecha_remision timestamptz,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, periodo, tipo)
);

ALTER TABLE public.dgii_periodos_remitidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own periodos" ON public.dgii_periodos_remitidos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all periodos" ON public.dgii_periodos_remitidos
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_periodos_updated BEFORE UPDATE ON public.dgii_periodos_remitidos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ CATÁLOGOS DGII ============
CREATE TABLE IF NOT EXISTS public.dgii_catalogos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogo text NOT NULL,
  codigo text NOT NULL,
  descripcion text NOT NULL,
  orden integer NOT NULL DEFAULT 0,
  UNIQUE (catalogo, codigo)
);

ALTER TABLE public.dgii_catalogos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read catalogos" ON public.dgii_catalogos
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.dgii_catalogos (catalogo, codigo, descripcion, orden) VALUES
  ('tipo_identificacion','1','RNC',1),
  ('tipo_identificacion','2','Cédula',2),
  ('tipo_identificacion','3','Pasaporte / ID Tributaria',3),
  ('tipo_ingreso','01','Operaciones (No financieros)',1),
  ('tipo_ingreso','02','Financieros',2),
  ('tipo_ingreso','03','Extraordinarios',3),
  ('tipo_ingreso','04','Arrendamientos',4),
  ('tipo_ingreso','05','Venta de Activo Depreciable',5),
  ('tipo_ingreso','06','Otros Ingresos',6),
  ('tipo_bienes','01','Gastos de personal',1),
  ('tipo_bienes','02','Trabajos, suministros y servicios',2),
  ('tipo_bienes','03','Arrendamientos',3),
  ('tipo_bienes','04','Activos fijos',4),
  ('tipo_bienes','05','Representación',5),
  ('tipo_bienes','06','Otras deducciones admitidas',6),
  ('tipo_bienes','07','Financieros',7),
  ('tipo_bienes','08','Extraordinarios',8),
  ('tipo_bienes','09','Compras y costo de venta',9),
  ('tipo_bienes','10','Adquisiciones de activos',10),
  ('tipo_bienes','11','Seguros',11),
  ('retencion_isr','01','Alquileres',1),
  ('retencion_isr','02','Honorarios por servicios',2),
  ('retencion_isr','03','Otras rentas',3),
  ('retencion_isr','04','Otras rentas (presuntas)',4),
  ('retencion_isr','05','Intereses pagados a personas jurídicas residentes',5),
  ('retencion_isr','06','Intereses pagados a personas físicas residentes',6),
  ('retencion_isr','07','Retención por proveedores del Estado',7),
  ('retencion_isr','08','Juegos telefónicos',8),
  ('retencion_isr','09','Subsector ganadería de carne bovina',9),
  ('forma_pago','1','Efectivo',1),
  ('forma_pago','2','Cheque/Transferencia/Depósito',2),
  ('forma_pago','3','Tarjeta crédito/débito',3),
  ('forma_pago','4','Compra a crédito',4),
  ('forma_pago','5','Permuta',5),
  ('forma_pago','6','Notas de crédito',6),
  ('forma_pago','7','Mixto',7),
  ('motivo_anulacion','02','Errores de impresión (pre-impreso)',1),
  ('motivo_anulacion','03','Impresión defectuosa',2),
  ('motivo_anulacion','04','Duplicidad de NCF',3),
  ('motivo_anulacion','05','Corrección de la información',4),
  ('motivo_anulacion','06','Cese de operaciones',5),
  ('motivo_anulacion','07','Pérdida o hurto de talonarios',6)
ON CONFLICT (catalogo, codigo) DO NOTHING;

-- ============ STORAGE: bucket reportes-fiscales ============
INSERT INTO storage.buckets (id, name, public)
  VALUES ('reportes-fiscales','reportes-fiscales', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Owner select reportes-fiscales" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'reportes-fiscales' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner insert reportes-fiscales" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reportes-fiscales' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner delete reportes-fiscales" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'reportes-fiscales' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ TRIGGER: bloquear cambios retroactivos en períodos enviados ============
CREATE OR REPLACE FUNCTION public.bloquear_periodo_remitido()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_periodo text;
  v_user uuid;
  v_fecha timestamptz;
BEGIN
  v_user := COALESCE(NEW.user_id, OLD.user_id);
  v_fecha := COALESCE(NEW.fecha, OLD.fecha);
  v_periodo := to_char(v_fecha, 'YYYYMM');
  IF EXISTS (
    SELECT 1 FROM public.dgii_periodos_remitidos
    WHERE user_id = v_user
      AND periodo = v_periodo
      AND estado IN ('enviado','aceptado')
  ) THEN
    RAISE EXCEPTION 'El período fiscal % ya fue remitido a la DGII y no puede modificarse', v_periodo;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_facturas_bloqueo_periodo ON public.facturas;
CREATE TRIGGER trg_facturas_bloqueo_periodo
  BEFORE UPDATE OR DELETE ON public.facturas
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_periodo_remitido();

DROP TRIGGER IF EXISTS trg_compras_bloqueo_periodo ON public.compras;
CREATE TRIGGER trg_compras_bloqueo_periodo
  BEFORE UPDATE OR DELETE ON public.compras
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_periodo_remitido();

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_facturas_user_fecha ON public.facturas (user_id, fecha);
CREATE INDEX IF NOT EXISTS idx_compras_user_fecha ON public.compras (user_id, fecha);
CREATE INDEX IF NOT EXISTS idx_periodos_user_periodo ON public.dgii_periodos_remitidos (user_id, periodo);
