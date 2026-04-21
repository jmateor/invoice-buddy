import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.96.0';
import { encryptPassword } from "../_shared/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Edge Function: cifra la contraseña del certificado .pfx con AES-GCM
 * usando una clave derivada de SUPABASE_SERVICE_ROLE_KEY, y la guarda en
 * ecf_configuracion.certificado_password_encrypted del usuario autenticado.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'No autorizado' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: 'No autorizado' }, 401);

    const { password, certificado_path, certificado_nombre, certificado_vigencia_hasta } = await req.json();
    if (typeof password !== 'string' || password.length < 1 || password.length > 512) {
      return json({ error: 'Contraseña inválida' }, 400);
    }

    const encrypted = await encryptPassword(password);

    const admin = createClient(supabaseUrl, serviceKey);
    const update: Record<string, unknown> = { certificado_password_encrypted: encrypted };
    if (certificado_path) update.certificado_path = certificado_path;
    if (certificado_nombre) update.certificado_nombre = certificado_nombre;
    if (certificado_vigencia_hasta) update.certificado_vigencia_hasta = certificado_vigencia_hasta;

    const { data: existing } = await admin
      .from('ecf_configuracion')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existing) {
      return json({ error: 'Configuración e-CF no encontrada. Completa el wizard primero.' }, 400);
    }

    const { error: updErr } = await admin
      .from('ecf_configuracion')
      .update(update)
      .eq('id', existing.id);
    if (updErr) throw updErr;

    return json({ success: true, mensaje: 'Contraseña cifrada y guardada' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido';
    console.error('ecf-encrypt-password error:', msg);
    return json({ error: msg }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}