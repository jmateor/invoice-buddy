
-- Fix next_ncf to generate proper 10-digit NCF and validate expiration
CREATE OR REPLACE FUNCTION public.next_ncf(p_user_id uuid, p_tipo text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_seq record;
  v_ncf text;
  v_next integer;
BEGIN
  SELECT * INTO v_seq FROM public.ncf_secuencias
    WHERE user_id = p_user_id AND tipo_comprobante = p_tipo AND activo = true
    FOR UPDATE;
  
  IF NOT FOUND THEN
    -- Auto-create sequence if not exists
    INSERT INTO public.ncf_secuencias (user_id, tipo_comprobante, secuencia_actual, secuencia_limite, prefijo, serie)
    VALUES (p_user_id, p_tipo, 1, 999999, p_tipo, LEFT(p_tipo, 1))
    RETURNING * INTO v_seq;
    
    -- Format: tipo(3) + 10-digit sequence = e.g. B0100000001
    v_ncf := p_tipo || LPAD('1', 10, '0');
    RETURN v_ncf;
  END IF;

  -- Validate expiration
  IF v_seq.fecha_vencimiento IS NOT NULL AND v_seq.fecha_vencimiento < CURRENT_DATE THEN
    RAISE EXCEPTION 'Secuencia NCF vencida para tipo %. Venció: %', p_tipo, v_seq.fecha_vencimiento;
  END IF;
  
  -- Validate not exhausted
  IF v_seq.secuencia_actual >= v_seq.secuencia_limite THEN
    RAISE EXCEPTION 'Secuencia NCF agotada para tipo %. Límite: %', p_tipo, v_seq.secuencia_limite;
  END IF;
  
  v_next := v_seq.secuencia_actual + 1;
  
  UPDATE public.ncf_secuencias 
    SET secuencia_actual = v_next
    WHERE id = v_seq.id;
  
  -- Format: tipo(3 chars like B01) + 10-digit padded sequence
  v_ncf := p_tipo || LPAD(v_next::text, 10, '0');
  RETURN v_ncf;
END;
$function$;

-- Create a simple invoice number generator function
CREATE OR REPLACE FUNCTION public.next_invoice_number(p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_max text;
  v_num integer;
BEGIN
  SELECT numero INTO v_max FROM public.facturas 
    WHERE user_id = p_user_id 
    ORDER BY created_at DESC LIMIT 1;
  
  IF v_max IS NULL THEN
    RETURN 'FAC-000001';
  END IF;
  
  -- Extract number part after 'FAC-'
  BEGIN
    v_num := CAST(REPLACE(v_max, 'FAC-', '') AS integer) + 1;
  EXCEPTION WHEN OTHERS THEN
    v_num := (SELECT COUNT(*) + 1 FROM public.facturas WHERE user_id = p_user_id);
  END;
  
  RETURN 'FAC-' || LPAD(v_num::text, 6, '0');
END;
$function$;
