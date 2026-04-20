/**
 * Valida el formato del RNC (Registro Nacional de Contribuyentes)
 * o cédula dominicana.
 * 
 * Reglas:
 * - RNC empresarial: 9 dígitos
 * - Cédula personal: 11 dígitos
 * - Solo números, sin guiones ni espacios
 * 
 * @param rnc - El RNC o cédula a validar
 * @returns true si es válido, false si no
 */
export function validateRNC(rnc: string | null | undefined): boolean {
  if (!rnc || rnc.trim() === '') {
    return true; // Campo vacío es válido (nullable)
  }
  
  // Limpiar cualquier caracter no numérico
  const cleanRNC = rnc.replace(/\D/g, '');
  
  // Debe ser exactamente 9 (RNC) o 11 (cédula) dígitos
  return cleanRNC.length === 9 || cleanRNC.length === 11;
}

/**
 * Formatea el RNC para mostrar (agrega guiones)
 * Ej: 123456789 -> 123-45678-9
 * Ej: 00112345678 -> 001-1234567-8
 */
export function formatRNC(rnc: string | null | undefined): string {
  if (!rnc) return '';
  
  const clean = rnc.replace(/\D/g, '');
  
  if (clean.length === 9) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 8)}-${clean.slice(8)}`;
  } else if (clean.length === 11) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 10)}-${clean.slice(10)}`;
  }
  
  return clean;
}

/**
 * Limpia el RNC dejando solo números
 */
export function cleanRNC(rnc: string): string {
  return rnc.replace(/\D/g, '');
}
