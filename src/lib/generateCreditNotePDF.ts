import jsPDF from "jspdf";
import type { NegocioData } from "./generateInvoicePDF";

export interface CreditNoteData {
  numero: string;
  fecha: string;
  facturaNumero: string;
  cliente: { nombre: string; rnc_cedula?: string | null };
  motivo: string;
  detalles: { nombre: string; cantidad: number; precio_unitario: number; subtotal: number }[];
  total: number;
  negocio?: NegocioData;
  formato?: "carta" | "80mm" | "58mm";
}

const fmt = (n: number) => `RD$ ${n.toLocaleString("es-DO", { minimumFractionDigits: 2 })}`;

function generate80mm(data: CreditNoteData, action: "download" | "print") {
  const width = 80;
  const doc = new jsPDF({ unit: "mm", format: [width, 200] });
  let y = 8;
  const cx = width / 2;
  const neg = data.negocio;

  // Header
  if (neg?.nombre_comercial) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(neg.nombre_comercial, cx, y, { align: "center" });
    y += 5;
  }
  if (neg?.rnc) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`RNC: ${neg.rnc}`, cx, y, { align: "center" });
    y += 3.5;
  }
  if (neg?.direccion) {
    doc.setFontSize(7);
    doc.text(neg.direccion, cx, y, { align: "center" });
    y += 3.5;
  }
  if (neg?.telefono) {
    doc.setFontSize(7);
    doc.text(`Tel: ${neg.telefono}`, cx, y, { align: "center" });
    y += 4;
  }

  // Title
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("NOTA DE CRÉDITO", cx, y, { align: "center" });
  y += 5;

  // Dashed line
  doc.setDrawColor(150);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(4, y, width - 4, y);
  y += 4;

  // Info
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  if (data.numero) {
    doc.text(`NC: ${data.numero}`, 4, y); y += 3.5;
  }
  doc.text(`Factura: ${data.facturaNumero}`, 4, y); y += 3.5;
  doc.text(`Fecha: ${new Date(data.fecha).toLocaleDateString("es-DO")}`, 4, y); y += 3.5;
  doc.text(`Cliente: ${data.cliente.nombre}`, 4, y); y += 3.5;
  if (data.cliente.rnc_cedula) {
    doc.text(`RNC/Cédula: ${data.cliente.rnc_cedula}`, 4, y); y += 3.5;
  }
  doc.text(`Motivo: ${data.motivo}`, 4, y, { maxWidth: width - 8 }); y += 5;

  // Dashed line
  doc.line(4, y, width - 4, y);
  y += 3;

  // Items
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Producto", 4, y);
  doc.text("Cant", 45, y, { align: "center" });
  doc.text("Total", width - 4, y, { align: "right" });
  y += 3;
  doc.setFont("helvetica", "normal");
  for (const d of data.detalles) {
    doc.text(d.nombre.substring(0, 25), 4, y);
    doc.text(String(d.cantidad), 45, y, { align: "center" });
    doc.text(fmt(d.subtotal), width - 4, y, { align: "right" });
    y += 3.5;
  }

  // Total
  y += 1;
  doc.line(4, y, width - 4, y);
  y += 4;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CRÉDITO TOTAL:", 4, y);
  doc.text(fmt(data.total), width - 4, y, { align: "right" });
  y += 7;

  // Important notice box
  doc.setDrawColor(0);
  doc.setLineDashPattern([], 0);
  doc.setLineWidth(0.5);
  doc.roundedRect(4, y, width - 8, 18, 2, 2);
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("⚠ AVISO IMPORTANTE", cx, y, { align: "center" });
  y += 4;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("No se realizan devoluciones en efectivo.", cx, y, { align: "center" });
  y += 3;
  doc.text("Este crédito es válido para futuras compras.", cx, y, { align: "center" });
  y += 3;
  doc.text("Presente este comprobante al momento de pagar.", cx, y, { align: "center" });
  y += 6;

  // Footer
  doc.setFontSize(7);
  doc.text("Gracias por su preferencia", cx, y, { align: "center" });

  if (action === "print") {
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  } else {
    doc.save(`NC_${data.numero || data.facturaNumero}.pdf`);
  }
}

function generateCartaPDF(data: CreditNoteData, action: "download" | "print") {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const neg = data.negocio;
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(neg?.nombre_comercial || "NOTA DE CRÉDITO", pageWidth / 2, y, { align: "center" });
  y += 8;

  if (neg?.rnc) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`RNC: ${neg.rnc}`, pageWidth / 2, y, { align: "center" });
    y += 5;
  }
  if (neg?.direccion) {
    doc.setFontSize(9);
    doc.text(neg.direccion, pageWidth / 2, y, { align: "center" });
    y += 5;
  }

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(220, 50, 50);
  doc.text("NOTA DE CRÉDITO", pageWidth / 2, y + 5, { align: "center" });
  doc.setTextColor(0);
  y += 15;

  // Info grid
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const info = [
    [`NC: ${data.numero || "—"}`, `Fecha: ${new Date(data.fecha).toLocaleDateString("es-DO")}`],
    [`Factura origen: ${data.facturaNumero}`, `Cliente: ${data.cliente.nombre}`],
    [`Motivo: ${data.motivo}`, data.cliente.rnc_cedula ? `RNC/Cédula: ${data.cliente.rnc_cedula}` : ""],
  ];
  for (const [left, right] of info) {
    doc.text(left, 20, y);
    if (right) doc.text(right, pageWidth - 20, y, { align: "right" });
    y += 6;
  }
  y += 5;

  // Items table
  const tableData = data.detalles.map(d => [d.nombre, String(d.cantidad), fmt(d.precio_unitario), fmt(d.subtotal)]);
  (doc as any).autoTable({
    startY: y,
    head: [["Producto", "Cantidad", "Precio Unit.", "Subtotal"]],
    body: tableData,
    margin: { left: 20, right: 20 },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [220, 50, 50] },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Total
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`CRÉDITO TOTAL: ${fmt(data.total)}`, pageWidth - 20, y, { align: "right" });
  y += 15;

  // Notice box
  doc.setDrawColor(220, 50, 50);
  doc.setLineWidth(0.8);
  doc.roundedRect(20, y, pageWidth - 40, 25, 3, 3);
  y += 8;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("⚠ AVISO IMPORTANTE", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("No se realizan devoluciones en efectivo.", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.text("Este crédito es válido únicamente para futuras compras. Presente este comprobante al momento de pagar.", pageWidth / 2, y, { align: "center", maxWidth: pageWidth - 50 });

  if (action === "print") {
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  } else {
    doc.save(`NC_${data.numero || data.facturaNumero}.pdf`);
  }
}

export function generateCreditNotePDF(data: CreditNoteData, action: "download" | "print" = "download") {
  const formato = data.formato || "80mm";
  if (formato === "carta") {
    generateCartaPDF(data, action);
  } else {
    generate80mm(data, action);
  }
}
