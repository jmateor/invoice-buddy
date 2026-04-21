import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  MonitorSmartphone, FileText, Stamp, Package, Users, ShoppingCart,
  BarChart3, ClipboardList, RotateCcw, Settings, Shield,
} from "lucide-react";

interface Guia {
  icon: any;
  titulo: string;
  resumen: string;
  pasos: { titulo: string; descripcion: string }[];
}

const GUIAS: Guia[] = [
  {
    icon: MonitorSmartphone, titulo: "Punto de Venta (POS)",
    resumen: "Cobros rápidos al consumidor final.",
    pasos: [
      { titulo: "Selecciona productos", descripcion: "Busca por nombre o escanea código de barras (F2 enfoca el buscador)." },
      { titulo: "Agrega al carrito", descripcion: "Ajusta cantidad o elimina líneas según necesites." },
      { titulo: "Cobra (F8)", descripcion: "Elige método de pago, ingresa monto recibido y confirma." },
      { titulo: "Imprime", descripcion: "El ticket se genera en el formato configurado (80mm/58mm)." },
    ],
  },
  {
    icon: FileText, titulo: "Facturación (NCF)",
    resumen: "Facturas formales con número de comprobante fiscal.",
    pasos: [
      { titulo: "Nueva Factura", descripcion: "Selecciona cliente, productos y tipo de comprobante (B01, B02, etc.)." },
      { titulo: "Guarda como borrador", descripcion: "Revisa antes de emitir; los borradores no consumen NCF." },
      { titulo: "Emite con NCF", descripcion: "Asigna el NCF de tu secuencia preferida y descuenta inventario." },
      { titulo: "Cobra o anula", descripcion: "Marca como cobrada cuando recibas el pago, o anula con motivo." },
    ],
  },
  {
    icon: Stamp, titulo: "e-CF (Facturación Electrónica DGII)",
    resumen: "Cumple con la Ley 32-23 enviando comprobantes a la DGII.",
    pasos: [
      { titulo: "Configura el emisor", descripcion: "Ve a Configuraciones → Fiscal → Configurar e-CF y completa el wizard." },
      { titulo: "Sube el certificado .pfx", descripcion: "Se almacena cifrado con AES-GCM en almacenamiento privado." },
      { titulo: "Genera e-CF desde una factura", descripcion: "Botón 'Enviar' en facturas con NCF tipo B01/B14/B15." },
      { titulo: "Firma → Envía → Consulta", descripcion: "En la pestaña e-CF de Facturación, sigue el flujo hasta 'Aceptado'." },
    ],
  },
  {
    icon: Package, titulo: "Productos e Inventario",
    resumen: "Catálogo, stock, costos y kardex.",
    pasos: [
      { titulo: "Crea categorías", descripcion: "Todo producto requiere una categoría." },
      { titulo: "Registra productos", descripcion: "Define precio, costo, stock mínimo, código de barras y garantía." },
      { titulo: "Movimientos automáticos", descripcion: "Las ventas, compras y notas de crédito ajustan stock y quedan en el kardex." },
      { titulo: "Imprime etiquetas", descripcion: "Genera etiquetas A4 con código de barras CODE128." },
    ],
  },
  {
    icon: Users, titulo: "Clientes y Proveedores",
    resumen: "Gestión de contactos comerciales con validación de RNC.",
    pasos: [
      { titulo: "Crea clientes", descripcion: "Nombre, RNC/cédula (9 u 11 dígitos), teléfono y dirección." },
      { titulo: "Crea proveedores", descripcion: "Necesarios para registrar compras y reporte 606." },
      { titulo: "Crea desde la factura", descripcion: "Si falta un cliente al facturar, créalo en el modal rápido." },
    ],
  },
  {
    icon: ShoppingCart, titulo: "Compras",
    resumen: "Registra entradas de inventario y costos.",
    pasos: [
      { titulo: "Selecciona proveedor", descripcion: "Si no existe, créalo primero en Proveedores." },
      { titulo: "Agrega productos y cantidades", descripcion: "El stock se incrementa al guardar." },
      { titulo: "Reporte 606", descripcion: "Las compras alimentan automáticamente el reporte fiscal 606." },
    ],
  },
  {
    icon: ClipboardList, titulo: "Órdenes de Servicio",
    resumen: "Recepción técnica de equipos con custodia 60 días.",
    pasos: [
      { titulo: "Recibe el equipo", descripcion: "Cliente, descripción, marca, modelo, serial y problema reportado." },
      { titulo: "Diagnostica y cotiza", descripcion: "Registra diagnóstico y costo estimado." },
      { titulo: "Notifica y entrega", descripcion: "Marca fecha de notificación; al entregar genera factura." },
    ],
  },
  {
    icon: RotateCcw, titulo: "Notas de Crédito",
    resumen: "Devoluciones y créditos al cliente.",
    pasos: [
      { titulo: "Selecciona la factura", descripcion: "Solo facturas emitidas o cobradas (no anuladas)." },
      { titulo: "Indica motivo y productos", descripcion: "El stock se restaura automáticamente." },
      { titulo: "Genera saldo a favor", descripcion: "El cliente puede usarlo en futuras compras (no convertible a efectivo)." },
    ],
  },
  {
    icon: BarChart3, titulo: "Reportes",
    resumen: "Operativos para gerencia y fiscales para la DGII.",
    pasos: [
      { titulo: "Pestaña Operativos", descripcion: "Filtra por fecha, cliente, categoría; ve gráficas y top productos." },
      { titulo: "Pestaña DGII", descripcion: "Genera 606 (compras), 607 (ventas), 608 (anulaciones)." },
      { titulo: "Exporta", descripcion: "Excel/CSV listos para subir al portal DGII." },
    ],
  },
  {
    icon: Settings, titulo: "Configuraciones",
    resumen: "Datos del negocio, secuencias fiscales y certificado e-CF.",
    pasos: [
      { titulo: "Negocio", descripcion: "Razón social, RNC, logo, mensaje de factura, formato de impresión." },
      { titulo: "Fiscal", descripcion: "Secuencias NCF (con preferida) y wizard de e-CF." },
      { titulo: "Impresión", descripcion: "Carta, 80mm o 58mm; impresión automática post-venta." },
    ],
  },
  {
    icon: Shield, titulo: "Usuarios y Roles",
    resumen: "RBAC con tres roles y permisos granulares.",
    pasos: [
      { titulo: "Admin", descripcion: "Acceso total: configuración, usuarios, anular, eliminar." },
      { titulo: "Contador", descripcion: "Reportes, exportar, descuentos." },
      { titulo: "Cajero", descripcion: "POS y facturación; sin acceso a configuración ni reportes fiscales." },
    ],
  },
];

export default function Ayuda() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Centro de Ayuda</h1>
        <p className="text-muted-foreground">Guías paso a paso para usar todos los módulos del sistema</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {GUIAS.map(g => {
          const Icon = g.icon;
          return (
            <Card key={g.titulo} className="hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base">{g.titulo}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{g.resumen}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="pasos" className="border-none">
                    <AccordionTrigger className="text-sm py-2">Ver pasos</AccordionTrigger>
                    <AccordionContent>
                      <ol className="space-y-2 text-sm">
                        {g.pasos.map((p, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                              {i + 1}
                            </span>
                            <div>
                              <div className="font-medium">{p.titulo}</div>
                              <div className="text-muted-foreground text-xs">{p.descripcion}</div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
