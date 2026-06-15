export interface DgiiDiagnostico {
  codigo: string;
  titulo: string;
  causa: string;
  acciones: string[];
  ejemplo?: string;
  severidad: "error" | "warning" | "info";
}

const DIAGNOSTICOS: Record<string, DgiiDiagnostico> = {
  CERTIFICADO_INVALIDO: {
    codigo: "CERTIFICADO_INVALIDO",
    titulo: "Certificado .pfx inválido o clave incorrecta",
    severidad: "error",
    causa:
      "El archivo .pfx no se pudo abrir: contraseña incorrecta, archivo corrupto, formato no PKCS#12 o certificado vencido / revocado por la Autoridad Certificadora.",
    acciones: [
      "Verifica que el archivo subido sea el .pfx (PKCS#12) emitido por una AC autorizada por DGII (Avansi, Camara TIC, etc.), no un .cer o .crt.",
      "Vuelve a guardar la contraseña del certificado en Configuraciones → Fiscal (sin espacios al inicio/final).",
      "Confirma que el certificado no esté vencido — revisa el campo 'Cert. vence' en el resultado de la prueba.",
      "Si fue revocado o renovado, solicita un nuevo .pfx a tu AC y vuélvelo a subir.",
    ],
    ejemplo:
      "Ejemplo: tu .pfx vence 2026-03-10 y hoy es 2026-06-15 → renueva con tu AC y sube el nuevo archivo.",
  },
  SEMILLA_FALLO: {
    codigo: "SEMILLA_FALLO",
    titulo: "No se pudo obtener la semilla de DGII",
    severidad: "error",
    causa:
      "El endpoint de autenticación (Semilla) no respondió o devolvió un XML inválido. Suele ser URL mal configurada, ambiente caído o sin acceso a internet desde el servidor.",
    acciones: [
      "Revisa que la URL de autenticación corresponda al ambiente activo (TesteCF, CerteCF o Producción).",
      "TesteCF: https://ecf.dgii.gov.do/testecf/autenticacion/api/Autenticacion/Semilla",
      "CerteCF: https://ecf.dgii.gov.do/certecf/autenticacion/api/Autenticacion/Semilla",
      "Producción: https://ecf.dgii.gov.do/ecf/autenticacion/api/Autenticacion/Semilla",
      "Verifica el estado del servicio DGII en https://dgii.gov.do (a veces hay mantenimientos).",
      "Vuelve a ejecutar 'Probar firma + autenticación' después de 1-2 minutos.",
    ],
    ejemplo:
      "Ejemplo: tienes el ambiente 'CerteCF' pero la URL apunta a /testecf/ → cambia la URL a /certecf/ y reintenta.",
  },
  AUTENTICACION_FALLO: {
    codigo: "AUTENTICACION_FALLO",
    titulo: "DGII rechazó la semilla firmada (token no emitido)",
    severidad: "error",
    causa:
      "La semilla fue firmada pero el endpoint ValidacionCSC no devolvió token. Causas comunes: RNC del certificado no coincide con el del emisor, firma XMLDSig mal construida, o el certificado no está autorizado para el ambiente.",
    acciones: [
      "Confirma que el RNC del .pfx coincida exactamente con el RNC configurado en 'Datos de la empresa'.",
      "Si estás en Producción, verifica que tu empresa esté aprobada por DGII para emitir e-CF (oficio de certificación).",
      "Si estás en CerteCF, completa primero el set de pruebas obligatorio antes de obtener aprobación.",
      "Revisa que el reloj del servidor esté sincronizado (NTP) — diferencias > 5 min invalidan la firma.",
      "Vuelve a subir el .pfx por si la firma se cargó corrupta.",
    ],
    ejemplo:
      "Ejemplo: RNC de la empresa = 131-12345-6 pero el .pfx fue emitido a 130-99999-1 → DGII rechaza. Sube el .pfx correcto de tu RNC.",
  },
  SIN_CERTIFICADO: {
    codigo: "SIN_CERTIFICADO",
    titulo: "No hay certificado .pfx cargado",
    severidad: "warning",
    causa: "Aún no has subido el archivo .pfx en Configuraciones → Fiscal.",
    acciones: [
      "Sube tu archivo .pfx en la sección 'Certificado digital'.",
      "Ingresa la contraseña del certificado.",
      "Guarda y vuelve a ejecutar la prueba.",
    ],
  },
  SIN_URL_AUTH: {
    codigo: "SIN_URL_AUTH",
    titulo: "Falta URL de autenticación DGII",
    severidad: "warning",
    causa: "El campo url_autenticacion está vacío en la configuración e-CF.",
    acciones: [
      "Completa las 5 URLs DGII según el ambiente (autenticación, recepción, consulta, anulación, aprobación comercial).",
      "Usa el asistente 'Configurar e-CF' para autocompletar URLs por ambiente.",
    ],
  },
  ERROR_RED: {
    codigo: "ERROR_RED",
    titulo: "Error de red llamando a la función",
    severidad: "error",
    causa: "El navegador no pudo invocar la edge function (sin conexión, CORS o función no desplegada).",
    acciones: [
      "Verifica tu conexión a internet.",
      "Recarga la página y reintenta.",
      "Si persiste, revisa los logs de la función ecf-dgii-client.",
    ],
  },
  ERROR_DGII: {
    codigo: "ERROR_DGII",
    titulo: "Error genérico devuelto por DGII",
    severidad: "error",
    causa: "DGII respondió con un error no clasificado. Revisa el mensaje exacto en 'Error:'.",
    acciones: [
      "Copia el mensaje completo y búscalo en la documentación e-CF de DGII.",
      "Verifica que la fecha/hora del servidor sea correcta.",
      "Reintenta tras unos minutos; si persiste, abre ticket con DGII.",
    ],
  },
};

export function diagnosticarCodigoDgii(codigo: string | null | undefined): DgiiDiagnostico | null {
  if (!codigo) return null;
  return DIAGNOSTICOS[codigo] ?? null;
}

export function listarCodigosDgii(): DgiiDiagnostico[] {
  return Object.values(DIAGNOSTICOS);
}