
CREATE TABLE public.ecf_pruebas_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  success boolean NOT NULL DEFAULT false,
  codigo text,
  ambiente text,
  mensaje text,
  error text,
  duracion_ms integer,
  certificado_vencido boolean,
  certificado_vigencia_hasta timestamptz,
  url_autenticacion text,
  token_preview text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.ecf_pruebas_log TO authenticated;
GRANT ALL ON public.ecf_pruebas_log TO service_role;

ALTER TABLE public.ecf_pruebas_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_pruebas" ON public.ecf_pruebas_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_pruebas" ON public.ecf_pruebas_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_delete_own_pruebas" ON public.ecf_pruebas_log
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_ecf_pruebas_log_user_created ON public.ecf_pruebas_log (user_id, created_at DESC);
