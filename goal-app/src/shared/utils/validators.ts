/**
 * Utilidades de validación
 */

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida longitud mínima de contraseña
 */
export function isValidPassword(password: string, minLength: number = 6): boolean {
  return password.length >= minLength;
}

/**
 * Valida que un string no esté vacío
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Valida formato de teléfono español (9 dígitos)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{8}$/;
  return phoneRegex.test(phone);
}

/**
 * Valida que dos contraseñas coincidan
 */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}