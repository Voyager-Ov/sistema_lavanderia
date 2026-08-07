/**
 * Generador de datos dinámicos únicos para pruebas aisladas de Playwright
 */
export function uniqueId(prefix = 'test'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${timestamp}_${random}`;
}

export function generateRandomEmail(prefix = 'user'): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}@test.com`;
}

export function generateRandomPhone(): string {
  return `11${Math.floor(10000000 + Math.random() * 90000000)}`;
}

export const TEST_PASSWORDS = {
  VALID: 'Password123',
  WEAK: '123',
  ADMIN: 'AdminPassword123',
  EMPLEADO: 'EmpleadoPassword123'
};
