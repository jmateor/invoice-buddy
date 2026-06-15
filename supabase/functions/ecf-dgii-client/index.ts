const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.96.0';
import forge from 'https://esm.sh/node-forge@1.3.1';
import { decryptPassword } from "../_shared/crypto.ts";

/**
 * Edge Function: Cliente DGII para e-CF
 * 
 * Acciones:
 * - firmar: Firma digital del XML (preparado para certificado .pfx)
 * - enviar: Envía e-CF firmado a DGII
 * - consultar: Consulta estado por TrackID
 * - anular: Solicita anulación de e-NCF
 */

interface DgiiRequest {
  action: 'firmar' | 'enviar' | 'consultar' | 'anular' | 'probar';
  ecf_documento_id?: string;
  motivo_anulacion?: string;
}

// ============================================================
// FIRMA XMLDSig REAL con certificado .pfx (RSA-SHA256, enveloped)
// ============================================================

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function sha256Base64(data: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return bytesToBase64(new Uint8Array(buf));
}

/**
 * Canonicalización XML simplificada (C14N 1.0):
 * - Normaliza saltos de línea
 * - Recorta espacios entre tags
 * Para validación estricta DGII, se recomienda integrar xml-c14n completo.
 */
function canonicalize(xml: string): string {
  return xml
    .replace(/\r\n?/g, '\n')
    .replace(/>\s+</g, '><')
    .trim();
}

interface PfxMaterial {
  privateKey: forge.pki.rsa.PrivateKey;
  certificatePem: string;
  certificateBase64: string;
  vigenciaHasta: string | null;
}

function loadPfx(pfxBytes: Uint8Array, password: string): PfxMaterial {
  const der = forge.util.createBuffer(pfxBytes);
  const asn1 = forge.asn1.fromDer(der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, password);

  // Extract private key
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]
    || p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]?.[0];
  if (!keyBag?.key) throw new Error('No se encontró clave privada en el .pfx');

  // Extract certificate
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag]?.[0];
  if (!certBag?.cert) throw new Error('No se encontró certificado en el .pfx');

  const cert = certBag.cert;
  const certPem = forge.pki.certificateToPem(cert);
  const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  const certBase64 = forge.util.encode64(certDer);

  return {
    privateKey: keyBag.key as forge.pki.rsa.PrivateKey,
    certificatePem: certPem,
    certificateBase64: certBase64,
    vigenciaHasta: cert.validity?.notAfter?.toISOString() ?? null,
  };
}

async function firmarXml(
  xml: string,
  pfxBytes: Uint8Array,
  password: string,
): Promise<{ xmlFirmado: string; hash: string; vigenciaHasta: string | null }> {
  const material = loadPfx(pfxBytes, password);

  // 1) Quitar firma previa si existe y canonicalizar
  const xmlBody = canonicalize(xml.replace(/<Signature[\s\S]*?<\/Signature>/g, ''));
  const digestValue = await sha256Base64(xmlBody);

  // 2) Construir SignedInfo
  const signedInfo =
    `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">` +
    `<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>` +
    `<SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>` +
    `<Reference URI="">` +
    `<Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/></Transforms>` +
    `<DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>` +
    `<DigestValue>${digestValue}</DigestValue>` +
    `</Reference>` +
    `</SignedInfo>`;

  // 3) Firmar SignedInfo con RSA-SHA256
  const md = forge.md.sha256.create();
  md.update(signedInfo, 'utf8');
  const signatureBytes = material.privateKey.sign(md);
  const signatureValue = forge.util.encode64(signatureBytes);

  // 4) Construir bloque Signature completo
  const signatureBlock =
    `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">` +
    signedInfo +
    `<SignatureValue>${signatureValue}</SignatureValue>` +
    `<KeyInfo><X509Data><X509Certificate>${material.certificateBase64}</X509Certificate></X509Data></KeyInfo>` +
    `</Signature>`;

  // 5) Insertar antes del cierre de la raíz
  const rootCloseMatch = xmlBody.match(/<\/([A-Za-z0-9_:]+)>\s*$/);
  if (!rootCloseMatch) throw new Error('No se pudo localizar el cierre del XML para insertar la firma');
  const rootName = rootCloseMatch[1];
  const xmlFirmado = xmlBody.replace(new RegExp(`</${rootName}>\\s*$`), `${signatureBlock}</${rootName}>`);

  return { xmlFirmado, hash: digestValue, vigenciaHasta: material.vigenciaHasta };
}

async function loadPfxFromStorage(supabase: ReturnType<typeof createClient>, path: string): Promise<Uint8Array> {
  const { data, error } = await supabase.storage.from('certificados-ecf').download(path);
  if (error || !data) throw new Error(`No se pudo descargar el certificado: ${error?.message || 'archivo no encontrado'}`);
  return new Uint8Array(await data.arrayBuffer());
}

// ============================================================
// COMUNICACIÓN REAL CON DGII (TesteCF / CerteCF / Producción)
// ============================================================

function deriveUrl(base: string | null | undefined, endpoint: string, fallbackAmbiente: string): string {
  if (base) {
    // Reemplaza el último segmento por el endpoint deseado
    return base.replace(/\/[^/]+$/, `/${endpoint}`);
  }
  const amb = fallbackAmbiente === 'eCF' ? 'eCF' : fallbackAmbiente;
  return `https://ecf.dgii.gov.do/${amb}/${endpoint}`;
}

/**
 * Mapea códigos DGII a estados internos.
 * Códigos DGII: 1=aceptado, 2=aceptado condicional, 3=rechazado,
 * 4=en proceso, 5=aceptado por vencimiento, 6=enviado.
 */
function mapearEstadoDgii(codigo: string | number | null | undefined): string {
  const c = String(codigo ?? '');
  switch (c) {
    case '1': return 'aceptado';
    case '2': return 'aceptado_condicional';
    case '3': return 'rechazado';
    case '4': return 'en_proceso';
    case '5': return 'aceptado_vencimiento';
    case '6': return 'enviado';
    default: return 'en_proceso';
  }
}

async function obtenerSemillaDgii(urlAutenticacion: string): Promise<string> {
  const url = deriveUrl(urlAutenticacion, 'Autenticacion/api/Autenticacion/Semilla', 'TesteCF');
  const res = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/xml' } });
  if (!res.ok) {
    // Fallback: el endpoint legado devolvía la semilla directo en url_autenticacion
    const legacy = await fetch(urlAutenticacion, { method: 'GET' });
    if (!legacy.ok) throw new Error(`DGII Semilla falló: HTTP ${res.status}`);
    return await legacy.text();
  }
  return await res.text();
}

async function validarSemillaYObtenerToken(
  urlAutenticacion: string,
  semillaFirmadaXml: string,
): Promise<string> {
  const url = deriveUrl(urlAutenticacion, 'Autenticacion/api/Autenticacion/ValidacionCSC', 'TesteCF');
  const form = new FormData();
  form.append('xml', new Blob([semillaFirmadaXml], { type: 'application/xml' }), 'semilla.xml');
  const res = await fetch(url, { method: 'POST', body: form });
  const text = await res.text();
  if (!res.ok) throw new Error(`DGII ValidacionCSC falló (${res.status}): ${text.slice(0, 300)}`);
  let parsed: any;
  try { parsed = JSON.parse(text); } catch { throw new Error(`Respuesta token inválida: ${text.slice(0, 200)}`); }
  const token = parsed?.token || parsed?.Token || parsed?.access_token;
  if (!token) throw new Error('DGII no devolvió token de autenticación');
  return token;
}

async function autenticarDgii(
  config: any,
  pfxBytes: Uint8Array,
  password: string,
): Promise<string> {
  const semilla = await obtenerSemillaDgii(config.url_autenticacion);
  const { xmlFirmado } = await firmarXml(semilla, pfxBytes, password);
  return await validarSemillaYObtenerToken(config.url_autenticacion, xmlFirmado);
}

async function enviarADgii(
  config: any,
  xmlFirmado: string,
  encf: string,
  token: string,
): Promise<{ trackId: string; estado: string; mensaje: string; codigo: string }> {
  const url = config.url_recepcion as string;
  const form = new FormData();
  form.append('xml', new Blob([xmlFirmado], { type: 'application/xml' }), `${encf}.xml`);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form,
  });
  const text = await res.text();
  let parsed: any = {};
  try { parsed = JSON.parse(text); } catch { parsed = { mensaje: text }; }
  if (!res.ok) {
    throw new Error(`DGII Recepción falló (${res.status}): ${parsed?.mensaje || text.slice(0, 300)}`);
  }
  const trackId = parsed?.trackId || parsed?.TrackId || parsed?.track_id || '';
  const codigo = String(parsed?.codigo ?? parsed?.Codigo ?? parsed?.estado ?? '6');
  const mensaje = parsed?.mensaje || parsed?.Mensaje || parsed?.mensajes?.[0]?.valor || `e-CF ${encf} recibido por DGII`;
  if (!trackId) throw new Error(`DGII no devolvió TrackID. Respuesta: ${text.slice(0, 200)}`);
  return { trackId, estado: mapearEstadoDgii(codigo), mensaje, codigo };
}

async function consultarEstado(
  config: any,
  trackId: string,
  token: string,
): Promise<{ estado: string; mensaje: string; codigo: string }> {
  const url = `${config.url_consulta_estado}?trackId=${encodeURIComponent(trackId)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
  });
  const text = await res.text();
  let parsed: any = {};
  try { parsed = JSON.parse(text); } catch { parsed = { mensaje: text }; }
  if (!res.ok) throw new Error(`DGII ConsultaEstado falló (${res.status}): ${parsed?.mensaje || text.slice(0, 200)}`);
  const codigo = String(parsed?.codigo ?? parsed?.Codigo ?? parsed?.estado ?? '4');
  const mensaje = parsed?.mensaje || parsed?.Mensaje || parsed?.mensajes?.[0]?.valor || 'Estado consultado';
  return { estado: mapearEstadoDgii(codigo), mensaje, codigo };
}

async function anularEcf(
  config: any,
  encf: string,
  motivo: string,
  rnc: string,
  pfxBytes: Uint8Array,
  password: string,
  token: string,
): Promise<{ estado: string; mensaje: string }> {
  // XML de anulación según esquema DGII
  const ahora = new Date();
  const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,'0')}-${String(ahora.getDate()).padStart(2,'0')}`;
  const anulXml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<ANECF>` +
    `<Encabezado><Version>1.0</Version>` +
    `<RNCEmisor>${rnc}</RNCEmisor>` +
    `<FechaHoraAnulacionENCF>${fecha}</FechaHoraAnulacionENCF>` +
    `<CantidadENCFAnulados>1</CantidadENCFAnulados>` +
    `</Encabezado>` +
    `<DetalleAnulacionENCF>` +
    `<eNCF>${encf}</eNCF>` +
    `<MotivoAnulacion>${motivo.replace(/[<>&]/g, '')}</MotivoAnulacion>` +
    `</DetalleAnulacionENCF>` +
    `</ANECF>`;
  const { xmlFirmado } = await firmarXml(anulXml, pfxBytes, password);
  const form = new FormData();
  form.append('xml', new Blob([xmlFirmado], { type: 'application/xml' }), `ANUL_${encf}.xml`);
  const res = await fetch(config.url_anulacion, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form,
  });
  const text = await res.text();
  let parsed: any = {};
  try { parsed = JSON.parse(text); } catch { parsed = { mensaje: text }; }
  if (!res.ok) throw new Error(`DGII Anulación falló (${res.status}): ${parsed?.mensaje || text.slice(0, 200)}`);
  return { estado: 'anulado', mensaje: parsed?.mensaje || `e-NCF ${encf} anulado exitosamente` };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: DgiiRequest = await req.json();
    const { action, ecf_documento_id, motivo_anulacion } = body;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Acción requerida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obtener configuración (requerida para todas las acciones)
    const { data: config } = await supabase
      .from('ecf_configuracion')
      .select('*')
      .eq('user_id', user.id)
      .eq('activo', true)
      .maybeSingle();

    if (!config) {
      return new Response(JSON.stringify({ error: 'Configuración fiscal no encontrada' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Para acciones sobre documentos específicos
    let doc: any = null;
    if (action !== 'probar') {
      if (!ecf_documento_id) {
        return new Response(JSON.stringify({ error: 'ID de documento requerido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: d } = await supabase
        .from('ecf_documentos')
        .select('*')
        .eq('id', ecf_documento_id)
        .single();
      if (!d) {
        return new Response(JSON.stringify({ error: 'Documento e-CF no encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      doc = d;
    }

    let resultado: any = {};

    switch (action) {
      case 'probar': {
        // Valida certificado .pfx + autenticación contra DGII (TesteCF/CerteCF/Producción)
        if (!config.certificado_path || !config.certificado_password_encrypted) {
          return new Response(JSON.stringify({
            error: 'No hay certificado .pfx configurado. Súbelo desde Configurar e-CF.',
            codigo: 'SIN_CERTIFICADO',
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        if (!config.url_autenticacion) {
          return new Response(JSON.stringify({
            error: 'URL de autenticación DGII no configurada.',
            codigo: 'SIN_URL_AUTH',
          }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const t0 = Date.now();
        try {
          const pwd = await decryptPassword(config.certificado_password_encrypted);
          const pfxBytes = await loadPfxFromStorage(supabase, config.certificado_path);
          // 1) Cargar y validar PFX
          const material = loadPfx(pfxBytes, pwd);
          const vigenciaHasta = material.vigenciaHasta;
          const vencido = vigenciaHasta ? new Date(vigenciaHasta) < new Date() : false;
          // 2) Pedir semilla
          const semilla = await obtenerSemillaDgii(config.url_autenticacion);
          // 3) Firmar semilla
          const { xmlFirmado } = await firmarXml(semilla, pfxBytes, pwd);
          // 4) Validar y obtener token
          const token = await validarSemillaYObtenerToken(config.url_autenticacion, xmlFirmado);

          // Actualizar vigencia detectada
          if (vigenciaHasta) {
            await supabase
              .from('ecf_configuracion')
              .update({ certificado_vigencia_hasta: vigenciaHasta })
              .eq('user_id', user.id);
          }

          resultado = {
            success: true,
            mensaje: '✅ Firma digital y autenticación con DGII exitosas',
            codigo: '200',
            ambiente: config.ambiente,
            url_autenticacion: config.url_autenticacion,
            certificado_vigencia_hasta: vigenciaHasta,
            certificado_vencido: vencido,
            token_obtenido: true,
            token_preview: typeof token === 'string' ? `${token.slice(0, 20)}…(${token.length} chars)` : null,
            duracion_ms: Date.now() - t0,
          };
        } catch (e: any) {
          const msg = String(e?.message || e);
          // Códigos amigables
          let codigo = 'ERROR_DGII';
          if (/pfx|pkcs12|clave privada|certificado/i.test(msg)) codigo = 'CERTIFICADO_INVALIDO';
          else if (/Semilla/i.test(msg)) codigo = 'SEMILLA_FALLO';
          else if (/ValidacionCSC|token/i.test(msg)) codigo = 'AUTENTICACION_FALLO';
          return new Response(JSON.stringify({
            success: false,
            error: msg,
            codigo,
            ambiente: config.ambiente,
            duracion_ms: Date.now() - t0,
          }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        break;
      }

      case 'firmar': {
        if (!doc.xml_sin_firma) {
          return new Response(JSON.stringify({ error: 'No hay XML para firmar' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!config.certificado_path || !config.certificado_password_encrypted) {
          return new Response(JSON.stringify({ error: 'No hay certificado .pfx configurado. Súbelo desde Configuraciones → Fiscal → Configurar e-CF.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const pwd = await decryptPassword(config.certificado_password_encrypted);
        const pfxBytes = await loadPfxFromStorage(supabase, config.certificado_path);
        const { xmlFirmado, hash, vigenciaHasta } = await firmarXml(doc.xml_sin_firma, pfxBytes, pwd);

        await supabase
          .from('ecf_documentos')
          .update({ xml_firmado: xmlFirmado, hash_firma: hash, updated_at: new Date().toISOString() })
          .eq('id', ecf_documento_id);

        if (vigenciaHasta) {
          await supabase
            .from('ecf_configuracion')
            .update({ certificado_vigencia_hasta: vigenciaHasta })
            .eq('user_id', user.id);
        }

        await supabase.from('ecf_historial_estados').insert({
          user_id: user.id,
          ecf_documento_id,
          estado_anterior: doc.estado_dgii,
          estado_nuevo: doc.estado_dgii,
          mensaje: 'XML firmado digitalmente',
        });

        resultado = { success: true, mensaje: 'XML firmado exitosamente', hash };
        break;
      }

      case 'enviar': {
        const xmlToSend = doc.xml_firmado || doc.xml_sin_firma;
        if (!xmlToSend) {
          return new Response(JSON.stringify({ error: 'No hay XML para enviar' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!config.certificado_path || !config.certificado_password_encrypted) {
          return new Response(JSON.stringify({ error: 'No hay certificado .pfx configurado para autenticar con DGII.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const pwd = await decryptPassword(config.certificado_password_encrypted);
        const pfxBytes = await loadPfxFromStorage(supabase, config.certificado_path);

        // Firmar si aún no está firmado
        let xmlFirmado = doc.xml_firmado;
        if (!xmlFirmado) {
          const firma = await firmarXml(doc.xml_sin_firma!, pfxBytes, pwd);
          xmlFirmado = firma.xmlFirmado;
          await supabase
            .from('ecf_documentos')
            .update({ xml_firmado: xmlFirmado, hash_firma: firma.hash })
            .eq('id', ecf_documento_id);
        }

        // Autenticar y enviar
        const token = await autenticarDgii(config, pfxBytes, pwd);
        const envio = await enviarADgii(config, xmlFirmado, doc.encf, token);

        await supabase
          .from('ecf_documentos')
          .update({
            estado_dgii: envio.estado,
            track_id: envio.trackId,
            mensaje_dgii: envio.mensaje,
            codigo_respuesta: envio.codigo,
            fecha_envio: new Date().toISOString(),
            intentos_envio: doc.intentos_envio + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', ecf_documento_id);

        await supabase.from('ecf_historial_estados').insert({
          user_id: user.id,
          ecf_documento_id,
          estado_anterior: doc.estado_dgii,
          estado_nuevo: envio.estado,
          codigo_respuesta: envio.codigo,
          mensaje: envio.mensaje,
        });

        resultado = { success: true, trackId: envio.trackId, estado: envio.estado, mensaje: envio.mensaje };
        break;
      }

      case 'consultar': {
        if (!doc.track_id) {
          return new Response(JSON.stringify({ error: 'Este documento no tiene TrackID. Debe enviarse primero.' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!config.certificado_path || !config.certificado_password_encrypted) {
          return new Response(JSON.stringify({ error: 'No hay certificado .pfx configurado para autenticar con DGII.' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const pwdC = await decryptPassword(config.certificado_password_encrypted);
        const pfxBytesC = await loadPfxFromStorage(supabase, config.certificado_path);
        const tokenC = await autenticarDgii(config, pfxBytesC, pwdC);
        const consulta = await consultarEstado(config, doc.track_id, tokenC);

        await supabase
          .from('ecf_documentos')
          .update({
            estado_dgii: consulta.estado,
            mensaje_dgii: consulta.mensaje,
            codigo_respuesta: consulta.codigo,
            fecha_respuesta: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', ecf_documento_id);

        await supabase.from('ecf_historial_estados').insert({
          user_id: user.id,
          ecf_documento_id,
          estado_anterior: doc.estado_dgii,
          estado_nuevo: consulta.estado,
          codigo_respuesta: consulta.codigo,
          mensaje: consulta.mensaje,
        });

        resultado = { success: true, estado: consulta.estado, mensaje: consulta.mensaje };
        break;
      }

      case 'anular': {
        if (!motivo_anulacion) {
          return new Response(JSON.stringify({ error: 'Debe indicar el motivo de anulación' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!config.certificado_path || !config.certificado_password_encrypted) {
          return new Response(JSON.stringify({ error: 'No hay certificado .pfx configurado para anular en DGII.' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const pwdA = await decryptPassword(config.certificado_password_encrypted);
        const pfxBytesA = await loadPfxFromStorage(supabase, config.certificado_path);
        const tokenA = await autenticarDgii(config, pfxBytesA, pwdA);
        const anulacion = await anularEcf(config, doc.encf, motivo_anulacion, config.rnc, pfxBytesA, pwdA, tokenA);

        await supabase
          .from('ecf_documentos')
          .update({
            estado_dgii: 'anulado',
            mensaje_dgii: anulacion.mensaje,
            fecha_anulacion: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', ecf_documento_id);

        await supabase.from('ecf_historial_estados').insert({
          user_id: user.id,
          ecf_documento_id,
          estado_anterior: doc.estado_dgii,
          estado_nuevo: 'anulado',
          mensaje: `Anulado: ${motivo_anulacion}`,
        });

        resultado = { success: true, estado: 'anulado', mensaje: anulacion.mensaje };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Acción no válida' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(resultado), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en ecf-dgii-client:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
