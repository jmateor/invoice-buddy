ALTER TABLE public.ecf_configuracion REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ecf_configuracion;