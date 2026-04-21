import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GuiaUso from "@/components/GuiaUso";
import FacturasList from "@/components/facturas/FacturasList";
import EcfBandeja from "@/components/ecf/EcfBandeja";

export default function Facturas() {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Facturación</h1>
        <p className="text-muted-foreground">Emite facturas con NCF y gestiona los e-CF enviados a la DGII</p>
      </div>

      <GuiaUso
        storageKey="facturas"
        titulo="Cómo funciona el ciclo de facturación"
        pasos={[
          { titulo: "Crea una factura", descripcion: "Desde 'Nueva Factura' o el POS, en estado borrador." },
          { titulo: "Emítela con NCF", descripcion: "Pulsa el botón Emitir: se asigna el NCF de tu secuencia preferida y descuenta inventario." },
          { titulo: "Genera e-CF (opcional)", descripcion: "Si el comprobante es B01/B14/B15, conviértelo a e-CF para enviar a DGII." },
          { titulo: "Firma y envía", descripcion: "En la pestaña e-CF: Firmar → Enviar → Consultar estado." },
        ]}
        tip="Configura tus secuencias y el certificado .pfx en Configuraciones → Fiscal antes de emitir e-CF."
      />

      <Tabs defaultValue="facturas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="facturas">Facturas (NCF)</TabsTrigger>
          <TabsTrigger value="ecf">e-CF (DGII)</TabsTrigger>
        </TabsList>
        <TabsContent value="facturas"><FacturasList /></TabsContent>
        <TabsContent value="ecf"><EcfBandeja /></TabsContent>
      </Tabs>
    </div>
  );
}
