
ALTER TYPE public.estado_factura ADD VALUE IF NOT EXISTS 'borrador';
ALTER TYPE public.estado_factura ADD VALUE IF NOT EXISTS 'emitida';
ALTER TYPE public.estado_factura ADD VALUE IF NOT EXISTS 'enviada_dgii';
ALTER TYPE public.estado_factura ADD VALUE IF NOT EXISTS 'aceptada';
ALTER TYPE public.estado_factura ADD VALUE IF NOT EXISTS 'rechazada';
ALTER TYPE public.estado_factura ADD VALUE IF NOT EXISTS 'cobrada';
