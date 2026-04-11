const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.96.0';

interface EcfRequest {
  factura_id?: string;
  nota_credito_id?: string;
  tipo_ecf: '31' | '32' | '33' | '34';
}

interface DetalleItem {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  itbis: number;
  subtotal: number;
}

// Tipos de comprobante DGII
const TIPOS_ECF: Record<string, string> = {
  '31': 'Factura de Crédito Fiscal Electrónica',
  '32': 'Factura de Consumo Electrónica',
  '33': 'Nota de Débito Electrónica',
  '34': 'Nota de Crédito Electrónica',
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatMonto(n: number): string {
  return n.toFixed(2);
}

function formatFecha(date: Date): string {
  return date.toISOString().split('.')[0];
}

function generarXmlEcf(params: {
  encf: string;
  tipo_ecf: string;
  emisor: {
    rnc: string;
    razon_social: string;
    nombre_comercial?: string;
    direccion?: string;
    municipio?: string;
    provincia?: string;
    telefono?: string;
    email?: string;
  };
  receptor: {
    rnc?: string;
    nombre: string;
    direccion?: string;
  };
  detalles: DetalleItem[];
  subtotal: number;
  itbis: number;
  descuento: number;
  total: number;
  fecha_emision: string;
  notas?: string;
  referencia_ncf?: string; // Para notas de crédito/débito
  ambiente: string;
}): string {
  const { encf, tipo_ecf, emisor, receptor, detalles, subtotal, itbis, descuento, total, fecha_emision, notas, referencia_ncf, ambiente } = params;

  const tipoIngreso = tipo_ecf === '31' ? '01' : tipo_ecf === '32' ? '01' : '01'; // 01 = Ingresos por operaciones
  const tipoPago = '01'; // 01 = Contado

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<ECF xmlns="https://dgii.gov.do/eCF">
  <!-- Sección A: Encabezado -->
  <Encabezado>
    <Version>1.0</Version>
    <IdDoc>
      <TipoeCF>${tipo_ecf}</TipoeCF>
      <eNCF>${escapeXml(encf)}</eNCF>
      <FechaVencimientoSecuencia></FechaVencimientoSecuencia>
      <IndicadorNotaCredito>${tipo_ecf === '34' ? '1' : '0'}</IndicadorNotaCredito>
      <TipoIngresos>${tipoIngreso}</TipoIngresos>
      <TipoPago>${tipoPago}</TipoPago>
      <FechaLimitePago>${formatFecha(new Date(fecha_emision))}</FechaLimitePago>
    </IdDoc>
    <Emisor>
      <RNCEmisor>${escapeXml(emisor.rnc)}</RNCEmisor>
      <RazonSocialEmisor>${escapeXml(emisor.razon_social)}</RazonSocialEmisor>
      ${emisor.nombre_comercial ? `<NombreComercial>${escapeXml(emisor.nombre_comercial)}</NombreComercial>` : ''}
      ${emisor.direccion ? `<DireccionEmisor>${escapeXml(emisor.direccion)}</DireccionEmisor>` : ''}
      ${emisor.municipio ? `<MunicipioEmisor>${escapeXml(emisor.municipio)}</MunicipioEmisor>` : ''}
      ${emisor.provincia ? `<ProvinciaEmisor>${escapeXml(emisor.provincia)}</ProvinciaEmisor>` : ''}
      ${emisor.telefono ? `<TelefonoEmisor>${escapeXml(emisor.telefono)}</TelefonoEmisor>` : ''}
      ${emisor.email ? `<CorreoEmisor>${escapeXml(emisor.email)}</CorreoEmisor>` : ''}
      <FechaEmision>${formatFecha(new Date(fecha_emision))}</FechaEmision>
    </Emisor>
    <Comprador>
      ${receptor.rnc ? `<RNCComprador>${escapeXml(receptor.rnc)}</RNCComprador>` : ''}
      <RazonSocialComprador>${escapeXml(receptor.nombre)}</RazonSocialComprador>
    </Comprador>
    <Totales>
      <MontoGravadoTotal>${formatMonto(subtotal)}</MontoGravadoTotal>
      <MontoGravadoI1>${formatMonto(subtotal)}</MontoGravadoI1>
      <ITBIS1>${formatMonto(itbis)}</ITBIS1>
      <TotalITBIS>${formatMonto(itbis)}</TotalITBIS>
      ${descuento > 0 ? `<MontoDescuento>${formatMonto(descuento)}</MontoDescuento>` : ''}
      <MontoTotal>${formatMonto(total)}</MontoTotal>
    </Totales>
  </Encabezado>

  <!-- Sección B: Detalle de Bienes o Servicios -->
  <DetallesItems>`;

  // Validar máximo 1000 líneas
  const items = detalles.slice(0, 1000);
  
  items.forEach((item, idx) => {
    const itbisUnit = item.itbis / item.cantidad;
    xml += `
    <Item>
      <NumeroLinea>${idx + 1}</NumeroLinea>
      <IndicadorFacturacion>1</IndicadorFacturacion>
      <NombreItem>${escapeXml(item.nombre)}</NombreItem>
      <IndicadorBienOServicio>1</IndicadorBienOServicio>
      <CantidadItem>${item.cantidad}</CantidadItem>
      <PrecioUnitarioItem>${formatMonto(item.precio_unitario)}</PrecioUnitarioItem>
      ${descuento > 0 && idx === 0 ? `<DescuentoMonto>${formatMonto(descuento)}</DescuentoMonto>` : ''}
      <MontoItem>${formatMonto(item.precio_unitario * item.cantidad)}</MontoItem>
    </Item>`;
  });

  xml += `
  </DetallesItems>`;

  // Sección F: Información de referencia (para notas de crédito/débito)
  if ((tipo_ecf === '33' || tipo_ecf === '34') && referencia_ncf) {
    xml += `

  <!-- Sección F: Información de Referencia -->
  <InformacionReferencia>
    <NCFModificado>${escapeXml(referencia_ncf)}</NCFModificado>
    <FechaNCFModificado>${formatFecha(new Date(fecha_emision))}</FechaNCFModificado>
    <CodigoModificacion>${tipo_ecf === '34' ? '01' : '01'}</CodigoModificacion>
  </InformacionReferencia>`;
  }

  // Placeholder para firma digital (Sección I)
  xml += `

  <!-- Sección I: Firma Digital (se agregará al firmar) -->
</ECF>`;

  return xml;
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

    // Verificar usuario
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

    const body: EcfRequest = await req.json();
    const { factura_id, nota_credito_id, tipo_ecf } = body;

    if (!TIPOS_ECF[tipo_ecf]) {
      return new Response(JSON.stringify({ error: 'Tipo de e-CF inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obtener configuración del emisor
    const { data: config, error: configError } = await supabase
      .from('ecf_configuracion')
      .select('*')
      .eq('user_id', user.id)
      .eq('activo', true)
      .maybeSingle();

    if (!config) {
      return new Response(JSON.stringify({ 
        error: 'No hay configuración fiscal. Configure los datos del emisor en Configuraciones → Datos Fiscales.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obtener datos de factura o nota de crédito
    let facturaData: any = null;
    let clienteData: any = null;
    let detalles: DetalleItem[] = [];
    let referencia_ncf: string | undefined;

    if (factura_id) {
      const { data: factura } = await supabase
        .from('facturas')
        .select('*, clientes(nombre, rnc_cedula)')
        .eq('id', factura_id)
        .single();

      if (!factura) {
        return new Response(JSON.stringify({ error: 'Factura no encontrada' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      facturaData = factura;
      clienteData = factura.clientes;

      const { data: items } = await supabase
        .from('detalle_facturas')
        .select('*, productos(nombre)')
        .eq('factura_id', factura_id);

      detalles = (items || []).map((item: any) => ({
        nombre: item.productos?.nombre || 'Producto',
        cantidad: item.cantidad,
        precio_unitario: Number(item.precio_unitario),
        itbis: Number(item.itbis),
        subtotal: Number(item.subtotal),
      }));
    } else if (nota_credito_id) {
      const { data: nota } = await supabase
        .from('notas_credito')
        .select('*, clientes(nombre, rnc_cedula), facturas(numero, ncf)')
        .eq('id', nota_credito_id)
        .single();

      if (!nota) {
        return new Response(JSON.stringify({ error: 'Nota de crédito no encontrada' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      facturaData = nota;
      clienteData = nota.clientes;
      referencia_ncf = nota.facturas?.ncf || nota.facturas?.numero;

      const { data: items } = await supabase
        .from('detalle_notas_credito')
        .select('*, productos(nombre)')
        .eq('nota_credito_id', nota_credito_id);

      detalles = (items || []).map((item: any) => ({
        nombre: item.productos?.nombre || 'Producto',
        cantidad: item.cantidad,
        precio_unitario: Number(item.precio_unitario),
        itbis: Number(item.itbis),
        subtotal: Number(item.subtotal),
      }));
    }

    if (detalles.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay detalles en el documento' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (detalles.length > 1000) {
      return new Response(JSON.stringify({ error: 'Máximo 1000 líneas de detalle permitidas' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generar e-NCF
    const { data: encf, error: encfError } = await supabase.rpc('next_encf', {
      p_user_id: user.id,
      p_tipo: tipo_ecf,
    });

    if (encfError) {
      return new Response(JSON.stringify({ error: `Error generando e-NCF: ${encfError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generar XML
    const xml = generarXmlEcf({
      encf,
      tipo_ecf,
      emisor: {
        rnc: config.rnc,
        razon_social: config.razon_social,
        nombre_comercial: config.nombre_comercial,
        direccion: config.direccion,
        municipio: config.municipio,
        provincia: config.provincia,
        telefono: config.telefono,
        email: config.email,
      },
      receptor: {
        rnc: clienteData?.rnc_cedula,
        nombre: clienteData?.nombre || 'Consumidor Final',
      },
      detalles,
      subtotal: Number(facturaData?.subtotal || 0),
      itbis: Number(facturaData?.itbis || 0),
      descuento: Number(facturaData?.descuento || 0),
      total: Number(facturaData?.total || 0),
      fecha_emision: facturaData?.fecha || facturaData?.created_at || new Date().toISOString(),
      notas: facturaData?.notas,
      referencia_ncf,
      ambiente: config.ambiente,
    });

    // Guardar documento e-CF
    const { data: ecfDoc, error: ecfError } = await supabase
      .from('ecf_documentos')
      .insert({
        user_id: user.id,
        factura_id: factura_id || null,
        nota_credito_id: nota_credito_id || null,
        encf,
        tipo_ecf,
        receptor_rnc: clienteData?.rnc_cedula,
        receptor_nombre: clienteData?.nombre,
        monto_total: Number(facturaData?.total || 0),
        monto_itbis: Number(facturaData?.itbis || 0),
        monto_subtotal: Number(facturaData?.subtotal || 0),
        xml_sin_firma: xml,
        estado_dgii: 'pendiente',
        ambiente: config.ambiente,
        fecha_emision: facturaData?.fecha || facturaData?.created_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (ecfError) {
      return new Response(JSON.stringify({ error: `Error guardando e-CF: ${ecfError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Registrar en historial
    await supabase.from('ecf_historial_estados').insert({
      user_id: user.id,
      ecf_documento_id: ecfDoc.id,
      estado_nuevo: 'pendiente',
      mensaje: 'e-CF generado exitosamente',
    });

    return new Response(JSON.stringify({
      success: true,
      ecf_id: ecfDoc.id,
      encf,
      tipo: TIPOS_ECF[tipo_ecf],
      estado: 'pendiente',
      mensaje: 'e-CF generado. Pendiente de firma y envío a DGII.',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en ecf-generate:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
