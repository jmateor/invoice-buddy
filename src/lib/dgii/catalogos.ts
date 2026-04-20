/**
 * Catálogos oficiales DGII para facturación electrónica e-CF
 * Ley 32-23 - Norma General 06-2018
 */

export const TIPOS_COMPROBANTE_FISCAL = [
  { codigo: "B01", tipo_ecf: "31", nombre: "Crédito Fiscal", descripcion: "Para empresas con RNC que necesitan crédito ITBIS", requiere_rnc: true },
  { codigo: "B02", tipo_ecf: "32", nombre: "Consumo", descripcion: "Para consumidor final", requiere_rnc: false },
  { codigo: "B04", tipo_ecf: "34", nombre: "Nota de Crédito", descripcion: "Devoluciones y ajustes a favor del cliente", requiere_rnc: false },
  { codigo: "B14", tipo_ecf: "44", nombre: "Régimen Especial", descripcion: "Zonas francas y regímenes especiales", requiere_rnc: true },
  { codigo: "B15", tipo_ecf: "45", nombre: "Gubernamental", descripcion: "Ventas al sector público", requiere_rnc: true },
  { codigo: "B16", tipo_ecf: "46", nombre: "Exportaciones", descripcion: "Comprobante para exportaciones", requiere_rnc: true },
] as const;

export const AMBIENTES_DGII = [
  {
    codigo: "TesteCF",
    nombre: "TesteCF (Pruebas)",
    descripcion: "Ambiente de pruebas para validar integración",
    urls: {
      autenticacion: "https://ecf.dgii.gov.do/TesteCF/AutorizacionSeed",
      recepcion: "https://ecf.dgii.gov.do/TesteCF/Recepcion",
      consulta_estado: "https://ecf.dgii.gov.do/TesteCF/ConsultaEstado",
      aprobacion_comercial: "https://ecf.dgii.gov.do/TesteCF/AprobacionComercial",
      anulacion: "https://ecf.dgii.gov.do/TesteCF/Anulacion",
    },
  },
  {
    codigo: "CerteCF",
    nombre: "CerteCF (Certificación)",
    descripcion: "Ambiente de certificación previo a producción",
    urls: {
      autenticacion: "https://ecf.dgii.gov.do/CerteCF/AutorizacionSeed",
      recepcion: "https://ecf.dgii.gov.do/CerteCF/Recepcion",
      consulta_estado: "https://ecf.dgii.gov.do/CerteCF/ConsultaEstado",
      aprobacion_comercial: "https://ecf.dgii.gov.do/CerteCF/AprobacionComercial",
      anulacion: "https://ecf.dgii.gov.do/CerteCF/Anulacion",
    },
  },
  {
    codigo: "Produccion",
    nombre: "Producción",
    descripcion: "Ambiente de producción real (DGII)",
    urls: {
      autenticacion: "https://ecf.dgii.gov.do/eCF/AutorizacionSeed",
      recepcion: "https://ecf.dgii.gov.do/eCF/Recepcion",
      consulta_estado: "https://ecf.dgii.gov.do/eCF/ConsultaEstado",
      aprobacion_comercial: "https://ecf.dgii.gov.do/eCF/AprobacionComercial",
      anulacion: "https://ecf.dgii.gov.do/eCF/Anulacion",
    },
  },
] as const;

/**
 * Provincias dominicanas (32) según catálogo DGII.
 */
export const PROVINCIAS_DR = [
  "Azua", "Bahoruco", "Barahona", "Dajabón", "Distrito Nacional", "Duarte",
  "El Seibo", "Elías Piña", "Espaillat", "Hato Mayor", "Hermanas Mirabal",
  "Independencia", "La Altagracia", "La Romana", "La Vega", "María Trinidad Sánchez",
  "Monseñor Nouel", "Monte Cristi", "Monte Plata", "Pedernales", "Peravia",
  "Puerto Plata", "Samaná", "San Cristóbal", "San José de Ocoa", "San Juan",
  "San Pedro de Macorís", "Sánchez Ramírez", "Santiago", "Santiago Rodríguez",
  "Santo Domingo", "Valverde",
] as const;

export type TipoComprobante = typeof TIPOS_COMPROBANTE_FISCAL[number]["codigo"];
export type AmbienteDGII = typeof AMBIENTES_DGII[number]["codigo"];