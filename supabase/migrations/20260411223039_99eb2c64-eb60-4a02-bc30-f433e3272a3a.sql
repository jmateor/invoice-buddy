
-- =============================================
-- MÓDULO e-CF: COMPROBANTES FISCALES ELECTRÓNICOS
-- Cumplimiento DGII - Ley 32-23
-- =============================================

-- 1. Configuración del emisor fiscal
CREATE TABLE public.ecf_configuracion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rnc text NOT NULL,
  razon_social text NOT NULL,
  nombre_comercial text,
  direccion text,
  telefono text,
  email text,
  municipio text,
  provincia text,
  -- Ambiente DGII
  ambiente text NOT NULL DEFAULT 'TesteCF' CHECK (ambiente IN ('TesteCF', 'eCF')),
  -- URLs de los Web Services DGII
  url_autenticacion text DEFAULT 'https://ecf.dgii.gov.do/TesteCF/AutorizacionSeed',
  url_recepcion text DEFAULT 'https://ecf.dgii.gov.do/TesteCF/Recepcion',
  url_consulta_estado text DEFAULT 'https://ecf.dgii.gov.do/TesteCF/ConsultaEstado',
  url_anulacion text DEFAULT 'https://ecf.dgii.gov.do/TesteCF/Anulacion',
  url_aprobacion_comercial text DEFAULT 'https://ecf.dgii.gov.do/TesteCF/AprobacionComercial',
  -- Certificado digital
  certificado_nombre text,
  certificado_vigencia_hasta timestamptz,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ecf_configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own ecf_configuracion"
  ON public.ecf_configuracion FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all ecf_configuracion"
  ON public.ecf_configuracion FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Secuencias e-NCF por tipo de comprobante
CREATE TABLE public.ecf_secuencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo_ecf text NOT NULL CHECK (tipo_ecf IN ('31', '32', '33', '34')),
  prefijo text NOT NULL DEFAULT 'E',
  secuencia_actual bigint NOT NULL DEFAULT 0,
  secuencia_desde bigint NOT NULL DEFAULT 1,
  secuencia_hasta bigint NOT NULL DEFAULT 9999999999,
  fecha_vencimiento date,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tipo_ecf)
);

ALTER TABLE public.ecf_secuencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own ecf_secuencias"
  ON public.ecf_secuencias FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Documentos e-CF (cada comprobante generado)
CREATE TABLE public.ecf_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  -- Referencia a factura o nota de crédito
  factura_id uuid REFERENCES public.facturas(id),
  nota_credito_id uuid REFERENCES public.notas_credito(id),
  -- Datos del e-CF
  encf text NOT NULL, -- E310000000001
  tipo_ecf text NOT NULL CHECK (tipo_ecf IN ('31', '32', '33', '34')),
  -- Receptor
  receptor_rnc text,
  receptor_nombre text,
  -- Montos
  monto_total numeric NOT NULL DEFAULT 0,
  monto_itbis numeric NOT NULL DEFAULT 0,
  monto_subtotal numeric NOT NULL DEFAULT 0,
  -- XML y firma
  xml_sin_firma text,
  xml_firmado text,
  hash_firma text,
  -- Estado DGII
  estado_dgii text NOT NULL DEFAULT 'pendiente' 
    CHECK (estado_dgii IN ('pendiente', 'enviado', 'aceptado', 'aceptado_condicional', 'rechazado', 'en_proceso', 'anulado')),
  track_id text,
  mensaje_dgii text,
  codigo_respuesta text,
  -- Fechas
  fecha_emision timestamptz NOT NULL DEFAULT now(),
  fecha_envio timestamptz,
  fecha_respuesta timestamptz,
  fecha_anulacion timestamptz,
  -- Metadata
  ambiente text NOT NULL DEFAULT 'TesteCF',
  intentos_envio integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ecf_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own ecf_documentos"
  ON public.ecf_documentos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all ecf_documentos"
  ON public.ecf_documentos FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Índices para búsquedas frecuentes
CREATE INDEX idx_ecf_documentos_encf ON public.ecf_documentos(encf);
CREATE INDEX idx_ecf_documentos_track_id ON public.ecf_documentos(track_id);
CREATE INDEX idx_ecf_documentos_estado ON public.ecf_documentos(estado_dgii);
CREATE INDEX idx_ecf_documentos_factura ON public.ecf_documentos(factura_id);
CREATE INDEX idx_ecf_documentos_fecha ON public.ecf_documentos(fecha_emision);

-- 4. Historial de estados (auditoría fiscal)
CREATE TABLE public.ecf_historial_estados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ecf_documento_id uuid NOT NULL REFERENCES public.ecf_documentos(id) ON DELETE CASCADE,
  estado_anterior text,
  estado_nuevo text NOT NULL,
  codigo_respuesta text,
  mensaje text,
  datos_respuesta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ecf_historial_estados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ecf_historial"
  ON public.ecf_historial_estados FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own ecf_historial"
  ON public.ecf_historial_estados FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ecf_historial_documento ON public.ecf_historial_estados(ecf_documento_id);

-- 5. Función para obtener siguiente e-NCF
CREATE OR REPLACE FUNCTION public.next_encf(p_user_id uuid, p_tipo text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq record;
  v_encf text;
  v_next bigint;
BEGIN
  -- Bloquear fila para evitar duplicados
  SELECT * INTO v_seq FROM public.ecf_secuencias
    WHERE user_id = p_user_id AND tipo_ecf = p_tipo AND activo = true
    FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Crear secuencia si no existe
    INSERT INTO public.ecf_secuencias (user_id, tipo_ecf, secuencia_actual)
    VALUES (p_user_id, p_tipo, 1)
    RETURNING * INTO v_seq;
    
    v_encf := 'E' || p_tipo || LPAD('1', 10, '0');
    RETURN v_encf;
  END IF;
  
  v_next := v_seq.secuencia_actual + 1;
  
  -- Validar que no exceda el límite
  IF v_next > v_seq.secuencia_hasta THEN
    RAISE EXCEPTION 'Secuencia e-NCF agotada para tipo %. Límite: %', p_tipo, v_seq.secuencia_hasta;
  END IF;
  
  -- Validar vencimiento
  IF v_seq.fecha_vencimiento IS NOT NULL AND v_seq.fecha_vencimiento < CURRENT_DATE THEN
    RAISE EXCEPTION 'Secuencia e-NCF vencida para tipo %. Venció: %', p_tipo, v_seq.fecha_vencimiento;
  END IF;
  
  UPDATE public.ecf_secuencias 
    SET secuencia_actual = v_next, updated_at = now()
    WHERE id = v_seq.id;
  
  -- Formato: E + tipo(2) + secuencia(10)
  v_encf := 'E' || p_tipo || LPAD(v_next::text, 10, '0');
  RETURN v_encf;
END;
$$;

-- 6. Trigger para updated_at
CREATE TRIGGER update_ecf_configuracion_updated_at
  BEFORE UPDATE ON public.ecf_configuracion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_ecf_secuencias_updated_at
  BEFORE UPDATE ON public.ecf_secuencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_ecf_documentos_updated_at
  BEFORE UPDATE ON public.ecf_documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
