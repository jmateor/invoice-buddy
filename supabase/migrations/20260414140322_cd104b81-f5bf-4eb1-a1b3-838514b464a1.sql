
-- 1. Improve ncf_secuencias with legal fields
ALTER TABLE public.ncf_secuencias 
  ADD COLUMN IF NOT EXISTS fecha_autorizacion date,
  ADD COLUMN IF NOT EXISTS fecha_vencimiento date,
  ADD COLUMN IF NOT EXISTS estado text NOT NULL DEFAULT 'activa';

-- 2. Create pagos_factura table for partial payments
CREATE TABLE IF NOT EXISTS public.pagos_factura (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id uuid NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
  monto numeric NOT NULL DEFAULT 0,
  metodo_pago text NOT NULL DEFAULT 'efectivo',
  referencia text,
  fecha timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

ALTER TABLE public.pagos_factura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own pagos_factura"
  ON public.pagos_factura FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Function to validate NCF sequence status
CREATE OR REPLACE FUNCTION public.validar_secuencia_ncf(p_user_id uuid, p_tipo text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_seq record;
  v_pct numeric;
  v_result jsonb;
BEGIN
  SELECT * INTO v_seq FROM public.ncf_secuencias
    WHERE user_id = p_user_id AND tipo_comprobante = p_tipo AND activo = true
    LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valido', false, 'error', 'No hay secuencia configurada para tipo ' || p_tipo, 'alerta', 'sin_secuencia');
  END IF;

  IF v_seq.fecha_vencimiento IS NOT NULL AND v_seq.fecha_vencimiento < CURRENT_DATE THEN
    RETURN jsonb_build_object('valido', false, 'error', 'Secuencia vencida el ' || v_seq.fecha_vencimiento::text, 'alerta', 'vencida');
  END IF;

  IF v_seq.secuencia_actual >= v_seq.secuencia_limite THEN
    RETURN jsonb_build_object('valido', false, 'error', 'Secuencia agotada. Actual: ' || v_seq.secuencia_actual || ' / Límite: ' || v_seq.secuencia_limite, 'alerta', 'agotada');
  END IF;

  v_pct := (v_seq.secuencia_actual::numeric / NULLIF(v_seq.secuencia_limite, 0)::numeric) * 100;

  v_result := jsonb_build_object(
    'valido', true,
    'secuencia_actual', v_seq.secuencia_actual,
    'secuencia_limite', v_seq.secuencia_limite,
    'porcentaje_uso', round(COALESCE(v_pct, 0), 1),
    'restantes', v_seq.secuencia_limite - v_seq.secuencia_actual,
    'fecha_vencimiento', v_seq.fecha_vencimiento
  );

  IF COALESCE(v_pct, 0) >= 90 THEN
    v_result := v_result || jsonb_build_object('alerta', 'proxima_agotar');
  ELSE
    v_result := v_result || jsonb_build_object('alerta', null);
  END IF;

  RETURN v_result;
END;
$$;

-- 4. Update default estado for new facturas to 'borrador'
ALTER TABLE public.facturas ALTER COLUMN estado SET DEFAULT 'borrador'::estado_factura;
