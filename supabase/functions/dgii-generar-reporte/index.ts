import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Tipo = "606" | "607" | "608";

const fmtFecha = (d: string | null | undefined) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
};

const fmtMonto = (n: number | null | undefined) => {
  const v = Number(n || 0);
  if (v === 0) return "";
  return v.toFixed(2);
};

const tipoIdFromRnc = (rnc: string | null) => {
  if (!rnc) return "";
  const clean = rnc.replace(/\D/g, "");
  if (clean.length === 9) return "1"; // RNC
  if (clean.length === 11) return "2"; // Cédula
  return "3"; // Pasaporte / otro
};

function buildHeader(rnc: string, periodo: string, cant: number) {
  // Encabezado oficial DGII (1 línea): tipo|RNC|periodo|cantidad
  return `${rnc.replace(/\D/g, "")}|${periodo}|${cant}`;
}

function build606Row(c: any): string {
  const cols = [
    (c.proveedores?.rnc || "").replace(/\D/g, ""),
    tipoIdFromRnc(c.proveedores?.rnc),
    c.tipo_bienes_servicios || "09",
    c.ncf || "",
    c.ncf_modificado || "",
    fmtFecha(c.fecha),
    fmtFecha(c.fecha_pago),
    fmtMonto(c.monto_servicios),
    fmtMonto(c.monto_bienes),
    fmtMonto(Number(c.monto_servicios || 0) + Number(c.monto_bienes || 0)),
    fmtMonto(c.itbis_facturado),
    fmtMonto(c.itbis_retenido),
    fmtMonto(c.itbis_proporcionalidad),
    fmtMonto(c.itbis_costo),
    "", // ITBIS por adelantar (se calcula automáticamente DGII)
    fmtMonto(c.itbis_percibido),
    c.tipo_retencion_isr || "",
    fmtMonto(c.monto_retencion_isr),
    fmtMonto(c.isr_percibido),
    fmtMonto(c.isc),
    fmtMonto(c.otros_impuestos),
    fmtMonto(c.propina_legal),
    c.forma_pago || "1",
  ];
  return cols.join("|");
}

function build607Row(f: any): string {
  const tipoId = tipoIdFromRnc(f.clientes?.rnc_cedula);
  const cols = [
    (f.clientes?.rnc_cedula || "").replace(/\D/g, ""),
    tipoId,
    f.ncf || "",
    f.ncf_modificado || "",
    f.tipo_ingreso || "01",
    fmtFecha(f.fecha),
    fmtFecha(f.fecha_retencion),
    fmtMonto(Number(f.subtotal || 0) - Number(f.descuento || 0)),
    fmtMonto(f.itbis),
    fmtMonto(f.itbis_retenido_terceros),
    fmtMonto(f.itbis_percibido),
    fmtMonto(f.retencion_isr_terceros),
    fmtMonto(f.isr_percibido),
    fmtMonto(f.isc),
    fmtMonto(f.otros_impuestos),
    fmtMonto(f.propina_legal),
    fmtMonto(f.monto_efectivo),
    fmtMonto(f.monto_cheque),
    fmtMonto(f.monto_tarjeta),
    fmtMonto(f.monto_credito),
    fmtMonto(f.monto_bonos),
    fmtMonto(f.monto_permuta),
    fmtMonto(f.monto_otros),
  ];
  return cols.join("|");
}

function build608Row(f: any): string {
  const cols = [
    f.ncf || "",
    fmtFecha(f.fecha_anulacion || f.fecha),
    f.motivo_anulacion || "05",
  ];
  return cols.join("|");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tipo, periodo, persistir } = (await req.json()) as {
      tipo: Tipo;
      periodo: string; // AAAAMM
      persistir?: boolean;
    };

    if (!/^(606|607|608)$/.test(tipo) || !/^\d{6}$/.test(periodo)) {
      return new Response(JSON.stringify({ error: "Parámetros inválidos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const year = Number(periodo.slice(0, 4));
    const month = Number(periodo.slice(4, 6));
    const desde = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const hasta = new Date(Date.UTC(year, month, 1)).toISOString();

    // RNC del negocio (encabezado)
    const { data: cfg } = await supabase
      .from("configuracion_negocio")
      .select("rnc, nombre_comercial")
      .eq("user_id", user.id)
      .maybeSingle();
    const rncEmisor = (cfg?.rnc || "").replace(/\D/g, "");

    let rows: string[] = [];
    let totalMonto = 0;
    let totalItbis = 0;
    const errores: { fila: number; campo: string; mensaje: string }[] = [];

    if (tipo === "606") {
      const { data, error } = await supabase
        .from("compras")
        .select("*, proveedores(rnc, nombre)")
        .eq("user_id", user.id)
        .gte("fecha", desde)
        .lt("fecha", hasta)
        .order("fecha");
      if (error) throw error;
      (data || []).forEach((c: any, i: number) => {
        if (!c.proveedores?.rnc) errores.push({ fila: i + 1, campo: "rnc", mensaje: "Proveedor sin RNC/Cédula" });
        if (!c.ncf) errores.push({ fila: i + 1, campo: "ncf", mensaje: "Compra sin NCF" });
        rows.push(build606Row(c));
        totalMonto += Number(c.total || 0);
        totalItbis += Number(c.itbis_facturado || 0);
      });
    } else if (tipo === "607") {
      const { data, error } = await supabase
        .from("facturas")
        .select("*, clientes(rnc_cedula, nombre)")
        .eq("user_id", user.id)
        .neq("estado", "borrador")
        .neq("estado", "anulada")
        .gte("fecha", desde)
        .lt("fecha", hasta)
        .order("fecha");
      if (error) throw error;
      (data || []).forEach((f: any, i: number) => {
        if (!f.ncf) errores.push({ fila: i + 1, campo: "ncf", mensaje: "Factura sin NCF" });
        rows.push(build607Row(f));
        totalMonto += Number(f.total || 0);
        totalItbis += Number(f.itbis || 0);
      });
    } else {
      const { data, error } = await supabase
        .from("facturas")
        .select("ncf, fecha, fecha_anulacion, motivo_anulacion")
        .eq("user_id", user.id)
        .eq("estado", "anulada")
        .gte("fecha", desde)
        .lt("fecha", hasta);
      if (error) throw error;
      (data || []).forEach((f: any, i: number) => {
        if (!f.ncf) errores.push({ fila: i + 1, campo: "ncf", mensaje: "Anulada sin NCF" });
        rows.push(build608Row(f));
      });
    }

    const header = buildHeader(rncEmisor, periodo, rows.length);
    const txt = [header, ...rows].join("\r\n") + "\r\n";
    const filename = `DGII_F_${tipo}_${rncEmisor || "SINRNC"}_${periodo}.TXT`;

    let archivoPath: string | null = null;
    if (persistir && rows.length > 0) {
      const path = `${user.id}/${periodo}/${filename}`;
      const { error: upErr } = await supabase.storage
        .from("reportes-fiscales")
        .upload(path, new Blob([txt], { type: "text/plain" }), {
          upsert: true,
          contentType: "text/plain",
        });
      if (upErr) throw upErr;
      archivoPath = path;

      // Upsert período
      await supabase.from("dgii_periodos_remitidos").upsert({
        user_id: user.id,
        periodo,
        tipo,
        cantidad_registros: rows.length,
        total_monto: totalMonto,
        total_itbis: totalItbis,
        archivo_txt_path: path,
        estado: "generado",
        fecha_generacion: new Date().toISOString(),
      }, { onConflict: "user_id,periodo,tipo" });

      await supabase.from("audit_logs").insert({
        user_id: user.id,
        accion: "dgii_generar_reporte",
        entidad: tipo,
        entidad_id: periodo,
        detalles: { registros: rows.length, total: totalMonto },
      });
    }

    return new Response(
      JSON.stringify({
        filename,
        txt,
        header,
        cantidad: rows.length,
        total_monto: totalMonto,
        total_itbis: totalItbis,
        errores,
        archivo_path: archivoPath,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});