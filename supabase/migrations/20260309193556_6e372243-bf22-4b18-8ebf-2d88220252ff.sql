
-- =============================================
-- 1. KARDEX - Movimientos de Inventario
-- =============================================
CREATE TABLE public.movimientos_inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
  tipo_movimiento text NOT NULL,
  cantidad integer NOT NULL,
  stock_anterior integer NOT NULL DEFAULT 0,
  stock_nuevo integer NOT NULL DEFAULT 0,
  referencia text,
  usuario_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view movimientos"
ON public.movimientos_inventario FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert movimientos"
ON public.movimientos_inventario FOR INSERT TO authenticated
WITH CHECK (auth.uid() = usuario_id);

-- =============================================
-- 2. NOTAS DE CRÉDITO
-- =============================================
CREATE TABLE public.notas_credito (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id uuid NOT NULL REFERENCES public.facturas(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  motivo text NOT NULL,
  total numeric NOT NULL DEFAULT 0,
  usuario_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notas_credito ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notas_credito"
ON public.notas_credito FOR SELECT TO authenticated
USING (auth.uid() = usuario_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can insert notas_credito"
ON public.notas_credito FOR INSERT TO authenticated
WITH CHECK (auth.uid() = usuario_id);

-- Detalle de notas de crédito (productos devueltos)
CREATE TABLE public.detalle_notas_credito (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nota_credito_id uuid NOT NULL REFERENCES public.notas_credito(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES public.productos(id),
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario numeric NOT NULL,
  itbis numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0
);

ALTER TABLE public.detalle_notas_credito ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own detalle_notas_credito"
ON public.detalle_notas_credito FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.notas_credito nc
  WHERE nc.id = detalle_notas_credito.nota_credito_id
  AND (nc.usuario_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Authenticated can insert detalle_notas_credito"
ON public.detalle_notas_credito FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.notas_credito nc
  WHERE nc.id = detalle_notas_credito.nota_credito_id
  AND nc.usuario_id = auth.uid()
));

-- Enable realtime for kardex
ALTER PUBLICATION supabase_realtime ADD TABLE public.movimientos_inventario;
