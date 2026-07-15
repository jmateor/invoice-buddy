
-- Cotizaciones module
CREATE TABLE IF NOT EXISTS public.cotizaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  numero text NOT NULL,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  fecha timestamptz NOT NULL DEFAULT now(),
  fecha_vencimiento date,
  subtotal numeric NOT NULL DEFAULT 0,
  itbis numeric NOT NULL DEFAULT 0,
  descuento numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','enviada','aprobada','rechazada','vencida','convertida')),
  notas text,
  terminos text,
  factura_id uuid REFERENCES public.facturas(id) ON DELETE SET NULL,
  fecha_conversion timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, numero)
);

CREATE TABLE IF NOT EXISTS public.detalle_cotizaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id uuid NOT NULL REFERENCES public.cotizaciones(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES public.productos(id) ON DELETE SET NULL,
  descripcion text NOT NULL,
  cantidad numeric NOT NULL DEFAULT 1,
  precio_unitario numeric NOT NULL DEFAULT 0,
  itbis numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_user ON public.cotizaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_cliente ON public.cotizaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_estado ON public.cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_detcot_cot ON public.detalle_cotizaciones(cotizacion_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotizaciones TO authenticated;
GRANT ALL ON public.cotizaciones TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.detalle_cotizaciones TO authenticated;
GRANT ALL ON public.detalle_cotizaciones TO service_role;

ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_cotizaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cot_owner_all" ON public.cotizaciones
  FOR ALL USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'contador'))
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "detcot_owner_all" ON public.detalle_cotizaciones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.cotizaciones c WHERE c.id = cotizacion_id
      AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'contador')))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.cotizaciones c WHERE c.id = cotizacion_id AND c.user_id = auth.uid())
  );

CREATE TRIGGER trg_cotizaciones_updated
  BEFORE UPDATE ON public.cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Numerador de cotizaciones
CREATE OR REPLACE FUNCTION public.next_quote_number(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max text;
  v_num integer;
BEGIN
  SELECT numero INTO v_max FROM public.cotizaciones
    WHERE user_id = p_user_id
    ORDER BY created_at DESC LIMIT 1;
  IF v_max IS NULL THEN
    RETURN 'COT-000001';
  END IF;
  BEGIN
    v_num := CAST(REPLACE(v_max, 'COT-', '') AS integer) + 1;
  EXCEPTION WHEN OTHERS THEN
    v_num := (SELECT COUNT(*) + 1 FROM public.cotizaciones WHERE user_id = p_user_id);
  END;
  RETURN 'COT-' || LPAD(v_num::text, 6, '0');
END;
$$;
