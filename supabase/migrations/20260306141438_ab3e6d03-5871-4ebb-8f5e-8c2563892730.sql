-- Allow all authenticated users to SELECT productos, clientes, categorias, config
CREATE POLICY "All authenticated can view productos"
ON public.productos FOR SELECT TO authenticated
USING (true);

CREATE POLICY "All authenticated can view clientes"
ON public.clientes FOR SELECT TO authenticated
USING (true);

CREATE POLICY "All authenticated can view categorias"
ON public.categorias FOR SELECT TO authenticated
USING (true);

CREATE POLICY "All authenticated can view config"
ON public.configuracion_negocio FOR SELECT TO authenticated
USING (true);

-- Add cedula and avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cedula text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT '';

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars');