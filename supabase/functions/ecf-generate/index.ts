const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.96.0';

interface EcfRequest {
  factura_id?: string;
  nota_credito_id?: string;
  tipo_ecf: '31' | '32' | '33' | '34' | '44';
}

interface DetalleItem {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  itbis: number;
  subtotal: number;
  es_servicio?: boolean;
}

// Tipos de comprobante DGII según Norma 05-19 y Ley 32-23
const TIPOS_ECF: Record<string, string> = {
  '31': 'Factura de Crédito Fiscal Electrónica',
  '32': 'Factura de Consumo Electrónica',
  '33': 'Nota de Débito Electrónica',
  '34': 'Nota de Crédito Electrónica',
  '44': 'Factura para Gobierno Electrónica',
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

function formatFechaISO(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '');
}

function formatFechaDGII(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Genera XML e-CF según formato oficial DGII
 * Estructura basada en el esquema XSD publicado por DGII
 * Secciones: A (Encabezado), B (Detalle), C (Subtotales), D (Descuentos),
 *            E (Referencia), F (Información Adicional), I (Firma Digital)
 */
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
    municipio?: string;
    provincia?: string;
  };
  detalles: DetalleItem[];
  subtotal: number;
  itbis: number;
  descuento: number;
  total: number;
  fecha_emision: string;
  notas?: string;
  referencia_ncf?: string;
  fecha_referencia?: string;
  ambiente: string;
  secuencia_vencimiento?: string;
  metodo_pago?: string;
}): string {
  const {
    encf, tipo_ecf, emisor, receptor, detalles,
    subtotal, itbis, descuento, total, fecha_emision,
    notas, referencia_ncf, fecha_referencia, ambiente,
    secuencia_vencimiento, metodo_pago
  } = params;

  // Tipo de ingreso según DGII: 01=Operaciones, 02=Financieros, 03=Extraordinarios, 04=Arrendamientos, 05=Activos, 06=Otros
  const tipoIngreso = '01';

  // Forma de pago: 1=Efectivo, 2=Cheque/Transferencia, 3=Tarjeta, 4=Venta a crédito, 5=Bonos, 6=Permuta, 7=Nota de crédito, 8=Mixto
  let formaPago = '1';
  if (metodo_pago === 'tarjeta') formaPago = '3';
  else if (metodo_pago === 'transferencia') formaPago = '2';
  else if (metodo_pago === 'nota_credito') formaPago = '7';

  // Tipo de pago: 1=Contado, 2=Crédito, 3=Gratuito
  const tipoPago = '1';

  const fechaEmisionDate = new Date(fecha_emision);

  // Calculate items with/without ITBIS
  let montoGravado = 0;
  let montoExento = 0;
  for (const d of detalles) {
    if (d.itbis > 0) {
      montoGravado += d.precio_unitario * d.cantidad;
    } else {
      montoExento += d.precio_unitario * d.cantidad;
    }
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<ECF xmlns="https://dgii.gov.do/eCF" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Encabezado>
    <Version>1.0</Version>
    <IdDoc>
      <TipoeCF>${tipo_ecf}</TipoeCF>
      <eNCF>${escapeXml(encf)}</eNCF>
      ${secuencia_vencimiento ? `<FechaVencimientoSecuencia>${escapeXml(secuencia_vencimiento)}</FechaVencimientoSecuencia>` : ''}
      ${tipo_ecf === '34' ? '<IndicadorNotaCredito>1</IndicadorNotaCredito>' : ''}
      <TipoIngresos>${tipoIngreso}</TipoIngresos>
      <TipoPago>${tipoPago}</TipoPago>
      <FormaPago>${formaPago}</FormaPago>
      <FechaLimitePago>${formatFechaISO(fechaEmisionDate)}</FechaLimitePago>
      <IndicadorMontoGravado>${montoGravado > 0 ? '1' : '0'}</IndicadorMontoGravado>
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
      <FechaEmision>${formatFechaISO(fechaEmisionDate)}</FechaEmision>
    </Emisor>
    <Comprador>
      ${receptor.rnc ? `<RNCComprador>${escapeXml(receptor.rnc)}</RNCComprador>` : ''}
      <RazonSocialComprador>${escapeXml(receptor.nombre)}</RazonSocialComprador>
    </Comprador>
    <Totales>
      ${montoGravado > 0 ? `<MontoGravadoTotal>${formatMonto(montoGravado)}</MontoGravadoTotal>` : ''}
      ${montoGravado > 0 ? `<MontoGravadoI1>${formatMonto(montoGravado)}</MontoGravadoI1>` : ''}
      ${montoExento > 0 ? `<MontoExento>${formatMonto(montoExento)}</MontoExento>` : ''}
      ${itbis > 0 ? `<ITBIS1>${formatMonto(itbis)}</ITBIS1>` : ''}
      ${itbis > 0 ? `<TotalITBIS>${formatMonto(itbis)}</TotalITBIS>` : ''}
      ${descuento > 0 ? `<MontoDescuento>${formatMonto(descuento)}</MontoDescuento>` : ''}
      <MontoTotal>${formatMonto(total)}</MontoTotal>
      <MontoNoFacturable>0.00</MontoNoFacturable>
      <MontoPagado>${formatMonto(total)}</MontoPagado>
    </Totales>
  </Encabezado>

  <DetallesItems>`;

  // Max 1000 lines per DGII spec
  const items = detalles.slice(0, 1000);

  items.forEach((item, idx) => {
    const itbisUnit = item.cantidad > 0 ? item.itbis / item.cantidad : 0;
    const montoItem = item.precio_unitario * item.cantidad;
    // IndicadorBienOServicio: 1=Bien, 2=Servicio
    const indicadorBS = item.es_servicio ? '2' : '1';
    // IndicadorFacturacion: 1=Normal
    const indicadorFact = '1';

    xml += `
    <Item>
      <NumeroLinea>${idx + 1}</NumeroLinea>
      <IndicadorFacturacion>${indicadorFact}</IndicadorFacturacion>
      <NombreItem>${escapeXml(item.nombre)}</NombreItem>
      <IndicadorBienOServicio>${indicadorBS}</IndicadorBienOServicio>
      <CantidadItem>${formatMonto(item.cantidad)}</CantidadItem>
      <UnidadMedida>1</UnidadMedida>
      <PrecioUnitarioItem>${formatMonto(item.precio_unitario)}</PrecioUnitarioItem>
      ${descuento > 0 && idx === 0 ? `<DescuentoMonto>${formatMonto(descuento)}</DescuentoMonto>` : ''}
      ${itbisUnit > 0 ? `<TablaSubDescuento>
        <SubDescuento>
          <TipoSubDescuento>1</TipoSubDescuento>
          <SubDescuentoPorcentaje>0.00</SubDescuentoPorcentaje>
        </SubDescuento>
      </TablaSubDescuento>` : ''}
      <MontoItem>${formatMonto(montoItem)}</MontoItem>
    </Item>`;
  });

  xml += `
  </DetallesItems>`;

  // Subtotales section
  xml += `

  <Subtotales>
    <CantidadItems>${items.length}</CantidadItems>
    <MontoSubtotalConDescuento>${formatMonto(subtotal - descuento)}</MontoSubtotalConDescuento>
  </Subtotales>`;

  // Reference section for credit/debit notes
  if ((tipo_ecf === '33' || tipo_ecf === '34') && referencia_ncf) {
    const fechaRef = fecha_referencia || fecha_emision;
    // CodigoModificacion: 01=Descuento, 02=Devolución, 03=Anulación, 04=Corrección, 05=Cambio de precio
    xml += `

  <InformacionReferencia>
    <NCFModificado>${escapeXml(referencia_ncf)}</NCFModificado>
    <FechaNCFModificado>${formatFechaISO(new Date(fechaRef))}</FechaNCFModificado>
    <CodigoModificacion>${tipo_ecf === '34' ? '02' : '01'}</CodigoModificacion>
  </InformacionReferencia>`;
  }

  // Additional info
  if (notas) {
    xml += `

  <InformacionAdicional>
    <FechaEmision>${formatFechaDGII(fechaEmisionDate)}</FechaEmision>
  </InformacionAdicional>`;
  }

  // Placeholder for digital signature (Section I - XMLDSig)
  xml += `

  <!-- Sección de Firma Digital: Se agregará al firmar con certificado .pfx -->
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
      return new Response(JSON.stringify({ error: 'Tipo de e-CF inválido. Tipos válidos: 31, 32, 33, 34, 44' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate: credit fiscal (31) and gov (44) require receptor RNC
    const requiresRNC = tipo_ecf === '31' || tipo_ecf === '44';

    // Get emisor config
    const { data: config } = await supabase
      .from('ecf_configuracion')
      .select('*')
      .eq('user_id', user.id)
      .eq('activo', true)
      .maybeSingle();

    if (!config) {
      return new Response(JSON.stringify({
        error: 'No hay configuración fiscal. Configure los datos del emisor en Comprobantes Electrónicos → Configuración Fiscal.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate emisor RNC
    if (!config.rnc || config.rnc.replace(/[-\s]/g, '').length < 9) {
      return new Response(JSON.stringify({
        error: 'El RNC del emisor no es válido. Configure un RNC válido en la configuración fiscal.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let facturaData: any = null;
    let clienteData: any = null;
    let detalles: DetalleItem[] = [];
    let referencia_ncf: string | undefined;
    let fecha_referencia: string | undefined;
    let metodo_pago: string | undefined;

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
      metodo_pago = factura.metodo_pago;

      const { data: items } = await supabase
        .from('detalle_facturas')
        .select('*, productos(nombre, tipo)')
        .eq('factura_id', factura_id);

      detalles = (items || []).map((item: any) => ({
        nombre: item.productos?.nombre || 'Producto',
        cantidad: item.cantidad,
        precio_unitario: Number(item.precio_unitario),
        itbis: Number(item.itbis),
        subtotal: Number(item.subtotal),
        es_servicio: item.productos?.tipo === 'servicio',
      }));
    } else if (nota_credito_id) {
      const { data: nota } = await supabase
        .from('notas_credito')
        .select('*, clientes(nombre, rnc_cedula), facturas(numero, ncf, fecha)')
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
      fecha_referencia = nota.facturas?.fecha;

      const { data: items } = await supabase
        .from('detalle_notas_credito')
        .select('*, productos(nombre, tipo)')
        .eq('nota_credito_id', nota_credito_id);

      detalles = (items || []).map((item: any) => ({
        nombre: item.productos?.nombre || 'Producto',
        cantidad: item.cantidad,
        precio_unitario: Number(item.precio_unitario),
        itbis: Number(item.itbis),
        subtotal: Number(item.subtotal),
        es_servicio: item.productos?.tipo === 'servicio',
      }));
    } else {
      return new Response(JSON.stringify({ error: 'Debe indicar factura_id o nota_credito_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (detalles.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay detalles en el documento' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (detalles.length > 1000) {
      return new Response(JSON.stringify({ error: 'Máximo 1000 líneas de detalle permitidas por la DGII' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate RNC for credit fiscal
    if (requiresRNC && (!clienteData?.rnc_cedula || clienteData.rnc_cedula.replace(/[-\s]/g, '').length < 9)) {
      return new Response(JSON.stringify({
        error: `El tipo e-CF ${tipo_ecf} (${TIPOS_ECF[tipo_ecf]}) requiere RNC/Cédula válido del receptor. El cliente no tiene RNC configurado.`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate totals consistency
    const calcSubtotal = detalles.reduce((s, d) => s + d.precio_unitario * d.cantidad, 0);
    const calcItbis = detalles.reduce((s, d) => s + d.itbis, 0);
    const storedTotal = Number(facturaData?.total || 0);
    const calcTotal = calcSubtotal + calcItbis - Number(facturaData?.descuento || 0);
    if (Math.abs(storedTotal - calcTotal) > 0.02) {
      console.warn(`Discrepancia en totales: calculado=${calcTotal.toFixed(2)}, almacenado=${storedTotal.toFixed(2)}`);
    }

    // Check for duplicate e-CF on same invoice
    if (factura_id) {
      const { data: existing } = await supabase
        .from('ecf_documentos')
        .select('id, encf, estado_dgii')
        .eq('factura_id', factura_id)
        .neq('estado_dgii', 'anulado')
        .limit(1);
      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({
          error: `Esta factura ya tiene un e-CF generado (${existing[0].encf}). Anule el existente antes de generar uno nuevo.`
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Generate e-NCF
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

    // Get sequence expiration for XML
    const { data: seqData } = await supabase
      .from('ecf_secuencias')
      .select('fecha_vencimiento')
      .eq('user_id', user.id)
      .eq('tipo_ecf', tipo_ecf)
      .eq('activo', true)
      .maybeSingle();

    // Generate XML
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
      fecha_referencia,
      ambiente: config.ambiente,
      secuencia_vencimiento: seqData?.fecha_vencimiento || undefined,
      metodo_pago,
    });

    // Save e-CF document
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

    // Update invoice state if applicable
    if (factura_id) {
      await supabase.from('facturas')
        .update({ estado: 'enviada_dgii' as any })
        .eq('id', factura_id);
    }

    // Record in history
    await supabase.from('ecf_historial_estados').insert({
      user_id: user.id,
      ecf_documento_id: ecfDoc.id,
      estado_nuevo: 'pendiente',
      mensaje: `e-CF ${TIPOS_ECF[tipo_ecf]} generado. e-NCF: ${encf}`,
    });

    return new Response(JSON.stringify({
      success: true,
      ecf_id: ecfDoc.id,
      encf,
      tipo: TIPOS_ECF[tipo_ecf],
      estado: 'pendiente',
      mensaje: `e-CF generado exitosamente. e-NCF: ${encf}. Pendiente de firma y envío a DGII.`,
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
