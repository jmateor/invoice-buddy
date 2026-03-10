
-- Add estado and numero columns to notas_credito for tracking consumption
ALTER TABLE public.notas_credito 
  ADD COLUMN estado text NOT NULL DEFAULT 'pendiente',
  ADD COLUMN numero text;

-- Add nota_credito to metodo_pago enum
ALTER TYPE public.metodo_pago ADD VALUE IF NOT EXISTS 'nota_credito';

-- Add nota_credito_id to facturas for linking
ALTER TABLE public.facturas 
  ADD COLUMN nota_credito_id uuid REFERENCES public.notas_credito(id);
