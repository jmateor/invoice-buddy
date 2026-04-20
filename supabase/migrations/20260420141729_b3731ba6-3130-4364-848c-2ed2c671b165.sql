-- 1. Ampliar ncf_secuencias con campos del wizard
ALTER TABLE public.ncf_secuencias
  ADD COLUMN IF NOT EXISTS nombre text,
  ADD COLUMN IF NOT EXISTS numeracion_automatica boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS preferida boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pie_factura text,
  ADD COLUMN IF NOT EXISTS sucursal text DEFAULT 'Principal';

-- Índice parcial: una sola "preferida" por (user_id, tipo_comprobante)
CREATE UNIQUE INDEX IF NOT EXISTS ncf_secuencias_preferida_unica
  ON public.ncf_secuencias (user_id, tipo_comprobante)
  WHERE preferida = true;

-- 2. Ampliar ecf_configuracion con ruta del .pfx y clave cifrada
ALTER TABLE public.ecf_configuracion
  ADD COLUMN IF NOT EXISTS certificado_path text,
  ADD COLUMN IF NOT EXISTS certificado_password_encrypted text;

-- 3. Bucket privado para certificados
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificados-ecf', 'certificados-ecf', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Políticas: cada usuario sólo accede a su carpeta {user_id}/...
DROP POLICY IF EXISTS "Users can view own certificados" ON storage.objects;
CREATE POLICY "Users can view own certificados"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'certificados-ecf' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload own certificados" ON storage.objects;
CREATE POLICY "Users can upload own certificados"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificados-ecf' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own certificados" ON storage.objects;
CREATE POLICY "Users can update own certificados"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'certificados-ecf' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own certificados" ON storage.objects;
CREATE POLICY "Users can delete own certificados"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'certificados-ecf' AND auth.uid()::text = (storage.foldername(name))[1]);