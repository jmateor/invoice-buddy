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
  action: 'firmar' | 'enviar' | 'consultar' | 'anular';
  ecf_documento_id: string;
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

// Simulación de comunicación con DGII
async function enviarADgii(config: any, xmlFirmado: string, encf: string): Promise<{
  trackId: string;
  estado: string;
  mensaje: string;
  codigo: string;
}> {
  // En producción real:
  // 1. Obtener Seed de autenticación: GET config.url_autenticacion
  // 2. Firmar Seed con certificado
  // 3. Obtener Token: POST con seed firmado
  // 4. Enviar e-CF: POST config.url_recepcion con XML firmado y token
  // 5. Recibir TrackID
  
  // Simulación para ambiente de pruebas
  const trackId = `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    trackId,
    estado: 'en_proceso',
    mensaje: `e-CF ${encf} enviado exitosamente al ambiente ${config.ambiente}. TrackID: ${trackId}`,
    codigo: '200',
  };
}

async function consultarEstado(config: any, trackId: string): Promise<{
  estado: string;
  mensaje: string;
  codigo: string;
}> {
  // En producción: GET config.url_consulta_estado?TrackId=XXX con token
  // Simulación
  return {
    estado: 'aceptado',
    mensaje: 'Documento aceptado por la DGII',
    codigo: '1',
  };
}

async function anularEcf(config: any, encf: string, motivo: string): Promise<{
  estado: string;
  mensaje: string;
}> {
  // En producción: POST config.url_anulacion con e-NCF y motivo
  return {
    estado: 'anulado',
    mensaje: `e-NCF ${encf} anulado exitosamente`,
  };
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

    if (!action || !ecf_documento_id) {
      return new Response(JSON.stringify({ error: 'Acción y ID de documento son requeridos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obtener documento
    const { data: doc, error: docError } = await supabase
      .from('ecf_documentos')
      .select('*')
      .eq('id', ecf_documento_id)
      .single();

    if (!doc) {
      return new Response(JSON.stringify({ error: 'Documento e-CF no encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obtener configuración
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

    let resultado: any = {};

    switch (action) {
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

        // Si no está firmado, firmar primero
        let xmlFirmado = doc.xml_firmado;
        if (!xmlFirmado) {
          if (!config.certificado_path || !config.certificado_password_encrypted) {
            return new Response(JSON.stringify({ error: 'No hay certificado .pfx configurado para firmar antes de enviar.' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          const pwd = await decryptPassword(config.certificado_password_encrypted);
          const pfxBytes = await loadPfxFromStorage(supabase, config.certificado_path);
          const firma = await firmarXml(doc.xml_sin_firma!, pfxBytes, pwd);
          xmlFirmado = firma.xmlFirmado;
          await supabase
            .from('ecf_documentos')
            .update({ xml_firmado: xmlFirmado, hash_firma: firma.hash })
            .eq('id', ecf_documento_id);
        }

        const envio = await enviarADgii(config, xmlFirmado, doc.encf);

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

        const consulta = await consultarEstado(config, doc.track_id);

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

        const anulacion = await anularEcf(config, doc.encf, motivo_anulacion);

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
