-- ============================================================================
-- Numeración fiscal atómica
-- ----------------------------------------------------------------------------
-- Problemas previos:
--  1) Race condition en la rama "IF NOT FOUND" de next_ncf/next_encf: dos
--     llamadas concurrentes insertaban la secuencia y una fallaba con
--     unique_violation NO capturada (error opaco al usuario).
--  2) La secuencia se incrementaba en una transacción separada de la inserción
--     del comprobante: si la app fallaba entre ambas, quedaba un HUECO en la
--     numeración fiscal (reportable a DGII).
--
-- Solución:
--  - next_encf/next_ncf ahora usan INSERT ... ON CONFLICT DO UPDATE ... RETURNING
--    para crear+incrementar atómicamente (sin race, sin excepción no capturada).
--  - Nueva RPC crear_ecf_documento(): en UNA transacción incrementa la
--    secuencia e inserta el ecf_documentos + historial. Si algo falla, todo se
--    revierte (sin hueco, sin duplicado).
-- ============================================================================

-- --------------------------------------------------------------------------
-- next_encf atómico
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.next_encf(p_user_id uuid, p_tipo text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq record;
  v_encf text;
BEGIN
  IF p_tipo NOT IN ('31','32','33','34') THEN
    RAISE EXCEPTION 'Tipo e-CF inválido: %', p_tipo;
  END IF;

  -- Crear o incrementar atómicamente (ON CONFLICT elimina la race condition).
  INSERT INTO public.ecf_secuencias (user_id, tipo_ecf, secuencia_actual, secuencia_desde, secuencia_hasta)
  VALUES (p_user_id, p_tipo, 1, 1, 9999999999)
  ON CONFLICT (user_id, tipo_ecf) DO UPDATE
    SET secuencia_actual = public.ecf_secuencias.secuencia_actual + 1,
        updated_at = now()
  RETURNING * INTO v_seq;

  IF v_seq.secuencia_actual > v_seq.secuencia_hasta THEN
    RAISE EXCEPTION 'Secuencia e-NCF agotada para tipo %. Límite: %', p_tipo, v_seq.secuencia_hasta;
  END IF;
  IF v_seq.fecha_vencimiento IS NOT NULL AND v_seq.fecha_vencimiento < CURRENT_DATE THEN
    RAISE EXCEPTION 'Secuencia e-NCF vencida para tipo %. Venció: %', p_tipo, v_seq.fecha_vencimiento;
  END IF;

  v_encf := 'E' || p_tipo || LPAD(v_seq.secuencia_actual::text, 10, '0');
  RETURN v_encf;
END;
$$;

-- --------------------------------------------------------------------------
-- next_ncf atómico
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.next_ncf(p_user_id uuid, p_tipo text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq record;
  v_ncf text;
BEGIN
  INSERT INTO public.ncf_secuencias (user_id, tipo_comprobante, secuencia_actual, secuencia_limite, prefijo, serie)
  VALUES (p_user_id, p_tipo, 1, 999999, p_tipo, LEFT(p_tipo, 1))
  ON CONFLICT (user_id, tipo_comprobante) DO UPDATE
    SET secuencia_actual = public.ncf_secuencias.secuencia_actual + 1
  RETURNING * INTO v_seq;

  IF v_seq.secuencia_actual >= v_seq.secuencia_limite THEN
    RAISE EXCEPTION 'Secuencia NCF agotada para tipo %. Límite: %', p_tipo, v_seq.secuencia_limite;
  END IF;
  IF v_seq.fecha_vencimiento IS NOT NULL AND v_seq.fecha_vencimiento < CURRENT_DATE THEN
    RAISE EXCEPTION 'Secuencia NCF vencida para tipo %. Venció: %', p_tipo, v_seq.fecha_vencimiento;
  END IF;

  v_ncf := p_tipo || LPAD(v_seq.secuencia_actual::text, 10, '0');
  RETURN v_ncf;
END;
$$;

-- --------------------------------------------------------------------------
-- crear_ecf_documento: reserva el e-NCF e inserta el documento en una sola
-- transacción. Devuelve (encf, documento_id). Cualquier fallo revierte todo.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crear_ecf_documento(
  p_user_id uuid,
  p_tipo text,
  p_xml text,
  p_factura_id uuid DEFAULT NULL,
  p_nota_credito_id uuid DEFAULT NULL,
  p_receptor_rnc text DEFAULT NULL,
  p_receptor_nombre text DEFAULT NULL,
  p_monto_total numeric DEFAULT 0,
  p_monto_itbis numeric DEFAULT 0,
  p_monto_subtotal numeric DEFAULT 0,
  p_fecha_emision timestamptz DEFAULT now(),
  p_ambiente text DEFAULT 'TesteCF'
)
RETURNS TABLE(encf text, documento_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seq record;
  v_encf text;
  v_xml text;
  v_doc_id uuid;
BEGIN
  IF p_tipo NOT IN ('31','32','33','34') THEN
    RAISE EXCEPTION 'Tipo e-CF inválido: %', p_tipo;
  END IF;

  -- Reservar secuencia atómicamente.
  INSERT INTO public.ecf_secuencias (user_id, tipo_ecf, secuencia_actual, secuencia_desde, secuencia_hasta)
  VALUES (p_user_id, p_tipo, 1, 1, 9999999999)
  ON CONFLICT (user_id, tipo_ecf) DO UPDATE
    SET secuencia_actual = public.ecf_secuencias.secuencia_actual + 1,
        updated_at = now()
  RETURNING * INTO v_seq;

  IF v_seq.secuencia_actual > v_seq.secuencia_hasta THEN
    RAISE EXCEPTION 'Secuencia e-NCF agotada para tipo %. Límite: %', p_tipo, v_seq.secuencia_hasta;
  END IF;
  IF v_seq.fecha_vencimiento IS NOT NULL AND v_seq.fecha_vencimiento < CURRENT_DATE THEN
    RAISE EXCEPTION 'Secuencia e-NCF vencida para tipo %. Venció: %', p_tipo, v_seq.fecha_vencimiento;
  END IF;

  v_encf := 'E' || p_tipo || LPAD(v_seq.secuencia_actual::text, 10, '0');

  -- Sustituir el placeholder del e-NCF en el XML (el frontend lo generó con
  -- '__ENCF__' porque el número se asigna aquí, atómicamente con el insert).
  v_xml := replace(p_xml, '__ENCF__', v_encf);

  -- Insertar documento e-CF (la unicidad de (user_id, encf) y el índice único
  -- parcial por factura activa protegen contra duplicados a nivel BD).
  INSERT INTO public.ecf_documentos (
    user_id, factura_id, nota_credito_id, encf, tipo_ecf,
    receptor_rnc, receptor_nombre,
    monto_total, monto_itbis, monto_subtotal,
    xml_sin_firma, estado_dgii, ambiente, fecha_emision
  ) VALUES (
    p_user_id, p_factura_id, p_nota_credito_id, v_encf, p_tipo,
    p_receptor_rnc, p_receptor_nombre,
    p_monto_total, p_monto_itbis, p_monto_subtotal,
    v_xml, 'pendiente', p_ambiente, p_fecha_emision
  ) RETURNING id INTO v_doc_id;

  INSERT INTO public.ecf_historial_estados (user_id, ecf_documento_id, estado_nuevo, mensaje)
  VALUES (p_user_id, v_doc_id, 'pendiente', 'e-CF generado: ' || v_encf);

  RETURN QUERY SELECT v_encf, v_doc_id;
END;
$$;

-- Backstop: una factura no puede tener dos e-CF activos (no anulados) a la vez.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ecf_documentos_factura_activa
  ON public.ecf_documentos(factura_id)
  WHERE factura_id IS NOT NULL AND estado_dgii <> 'anulado';