
-- Add saldo_disponible column to notas_credito for tracking remaining balance
ALTER TABLE public.notas_credito ADD COLUMN IF NOT EXISTS saldo_disponible numeric NOT NULL DEFAULT 0;

-- Backfill: set saldo_disponible = total for pendiente notes, 0 for consumida
UPDATE public.notas_credito SET saldo_disponible = CASE WHEN estado = 'pendiente' THEN total ELSE 0 END;
