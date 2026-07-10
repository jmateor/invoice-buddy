import { Eye, Image as ImageIcon } from "lucide-react";

interface Props {
  formato: string;
  negocio: {
    nombre_comercial?: string;
    rnc?: string;
    direccion?: string;
    telefono?: string;
    whatsapp?: string;
    email?: string;
    mensaje_factura?: string;
    logo_url?: string;
  };
}

const fmt = (n: number) => `RD$ ${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

export default function ImpresionPreview({ formato, negocio }: Props) {
  const subtotal = 350;
  const itbis = 63;
  const total = subtotal + itbis;
  const today = new Date().toLocaleDateString("es-DO");

  const isThermal = formato === "80mm" || formato === "58mm";
  const width = formato === "58mm" ? "w-[220px]" : formato === "80mm" ? "w-[280px]" : "w-full";

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Vista Previa en Vivo</h3>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-2 py-1 rounded-full">
          Simulación tiempo real
        </span>
      </div>

      <div className="flex justify-center">
        <div className={`${width} bg-card border border-border rounded-lg shadow-sm p-4 ${isThermal ? "text-xs font-mono" : "text-sm"}`}>
          {/* Header */}
          <div className={isThermal ? "text-center space-y-0.5" : "flex items-start gap-3 pb-3 border-b border-border"}>
            {!isThermal && (
              <div className="h-14 w-14 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                {negocio.logo_url ? (
                  <img src={negocio.logo_url} alt="logo" className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            )}
            <div className={isThermal ? "" : "flex-1 min-w-0"}>
              <p className={`font-bold text-foreground ${isThermal ? "" : "text-base"}`}>
                {negocio.nombre_comercial || "Nombre del Negocio"}
              </p>
              {negocio.rnc && <p className="text-muted-foreground">RNC: {negocio.rnc}</p>}
              {negocio.direccion && <p className="text-muted-foreground truncate">{negocio.direccion}</p>}
              {negocio.telefono && (
                <p className="text-muted-foreground">
                  Tel: {negocio.telefono}
                  {negocio.whatsapp && <> • WhatsApp: {negocio.whatsapp}</>}
                </p>
              )}
              {negocio.email && <p className="text-muted-foreground truncate">{negocio.email}</p>}
            </div>
          </div>

          {/* Factura info */}
          <div className={`${isThermal ? "text-center border-t border-dashed my-2 pt-2" : "flex justify-between mt-3"}`}>
            {isThermal ? (
              <>
                <p className="font-bold">FACTURA FAC-000003</p>
                <p>Tipo: Crédito Fiscal</p>
                <p>Fecha: {today}</p>
                <p>Cliente: Luis</p>
                <p>Pago: Efectivo</p>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Cliente</p>
                  <p className="font-medium text-foreground">Luis</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">FACTURA</p>
                  <p className="text-xs">FAC-000003</p>
                  <p className="text-[11px] text-muted-foreground">Tipo: Crédito Fiscal</p>
                  <p className="text-[11px] text-muted-foreground">Fecha: {today}</p>
                  <p className="text-[11px] text-muted-foreground">Pago: Efectivo</p>
                </div>
              </>
            )}
          </div>

          {/* Detalle */}
          {isThermal ? (
            <>
              <div className="border-t border-dashed my-2 pt-2">
                <div className="flex justify-between">
                  <span>1× Forro telefono</span>
                  <span>{fmt(subtotal)}</span>
                </div>
              </div>
              <div className="border-t border-dashed my-2 pt-2 space-y-0.5">
                <div className="flex justify-between"><span>Subtotal:</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between"><span>ITBIS (18%):</span><span>{fmt(itbis)}</span></div>
                <div className="flex justify-between font-bold border-t border-dashed pt-1 mt-1">
                  <span>TOTAL:</span><span>{fmt(total)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-3">
              <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-t flex justify-between">
                <span>Detalle</span><span>Total</span>
              </div>
              <div className="border border-border border-t-0 rounded-b px-3 py-2 text-sm flex justify-between">
                <div>
                  <p className="text-foreground">1× Forro de telefono Samsung s23</p>
                  <p className="text-[10px] text-muted-foreground italic">Garantía: No tiene Garantías</p>
                </div>
                <span className="font-medium">{fmt(subtotal + itbis)}</span>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-end gap-8"><span className="text-muted-foreground">Subtotal:</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-end gap-8"><span className="text-muted-foreground">ITBIS (18%):</span><span>{fmt(itbis)}</span></div>
                <div className="flex justify-end gap-8 font-bold text-base pt-1 border-t border-border">
                  <span>TOTAL:</span><span className="text-primary">{fmt(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className={`${isThermal ? "text-center border-t border-dashed mt-2 pt-2" : "mt-4 pt-3 border-t border-border"}`}>
            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">
              Documento con valor fiscal
            </p>
            {negocio.rnc && <p className="text-[10px] text-muted-foreground mt-1">RNC Emisor: {negocio.rnc}</p>}
            <p className="text-[10px] text-muted-foreground">NCF: B010000550003</p>
            <p className="text-[10px] text-muted-foreground">Verifique en: dgii.gov.do</p>
            {negocio.mensaje_factura && (
              <p className={`italic text-muted-foreground mt-2 ${isThermal ? "text-center" : "text-center text-xs"}`}>
                {negocio.mensaje_factura}
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-3">
        Formato activo: <span className="font-semibold text-foreground">{formato === "carta" ? "Carta / A4" : formato === "80mm" ? "Térmica 80mm" : "Térmica 58mm"}</span>
      </p>
    </div>
  );
}