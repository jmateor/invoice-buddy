
-- Tabla de órdenes de servicio / entrada de equipos
CREATE TABLE public.ordenes_servicio (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  equipo_descripcion text NOT NULL,
  marca text DEFAULT '',
  modelo text DEFAULT '',
  serial text DEFAULT '',
  problema_reportado text NOT NULL,
  diagnostico text DEFAULT '',
  costo_estimado numeric NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'recibido',
  fecha_entrada timestamp with time zone NOT NULL DEFAULT now(),
  fecha_notificacion timestamp with time zone DEFAULT NULL,
  fecha_entrega timestamp with time zone DEFAULT NULL,
  factura_id uuid DEFAULT NULL REFERENCES public.facturas(id),
  notas text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ordenes_servicio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own ordenes_servicio"
ON public.ordenes_servicio
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_ordenes_servicio_updated_at
BEFORE UPDATE ON public.ordenes_servicio
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Index for quick lookups
CREATE INDEX idx_ordenes_servicio_estado ON public.ordenes_servicio(estado);
CREATE INDEX idx_ordenes_servicio_cliente ON public.ordenes_servicio(cliente_id);
