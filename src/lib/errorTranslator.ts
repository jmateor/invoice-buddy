const translations: Record<string, string> = {
  "Invalid login credentials": "Credenciales de inicio de sesión inválidas",
  "Email not confirmed": "El correo electrónico no ha sido confirmado",
  "User already registered": "El usuario ya está registrado",
  "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres",
  "Signup requires a valid password": "Se requiere una contraseña válida para registrarse",
  "Email rate limit exceeded": "Se excedió el límite de intentos por correo. Intente más tarde",
  "For security purposes, you can only request this after": "Por seguridad, solo puede solicitar esto después de",
  "User not found": "Usuario no encontrado",
  "New password should be different from the old password": "La nueva contraseña debe ser diferente a la anterior",
  "Auth session missing": "Sesión de autenticación no encontrada. Inicie sesión nuevamente",
  "JWT expired": "Su sesión ha expirado. Inicie sesión nuevamente",
  "Token has expired or is invalid": "El token ha expirado o es inválido",
  "duplicate key value violates unique constraint": "Ya existe un registro con esos datos (valor duplicado)",
  "violates foreign key constraint": "No se puede eliminar porque tiene registros relacionados",
  "null value in column": "Falta un campo obligatorio",
  "permission denied": "No tiene permisos para realizar esta acción",
  "new row violates row-level security policy": "No tiene permisos para realizar esta operación",
  "check constraint": "Los datos no cumplen con las validaciones requeridas",
  "value too long for type": "El texto ingresado es demasiado largo",
  "invalid input syntax": "Formato de dato inválido",
  "connection refused": "Error de conexión con el servidor. Intente más tarde",
  "Failed to fetch": "Error de conexión. Verifique su internet",
  "Load failed": "Error al cargar datos. Verifique su conexión",
  "NetworkError": "Error de red. Verifique su conexión a internet",
  "rate limit": "Demasiados intentos. Espere un momento antes de reintentar",
  "storage/object-not-found": "Archivo no encontrado",
  "Bucket not found": "Almacenamiento no configurado",
  "The object exceeds the maximum allowed size": "El archivo excede el tamaño máximo permitido",
};

export function traducirError(message: string): string {
  if (!message) return "Error desconocido";

  // Direct match
  const direct = translations[message];
  if (direct) return direct;

  // Partial match
  for (const [key, value] of Object.entries(translations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // If it looks like English, wrap it
  if (/^[a-zA-Z\s.,!?]+$/.test(message.trim())) {
    return `Error: ${message}`;
  }

  return message;
}
