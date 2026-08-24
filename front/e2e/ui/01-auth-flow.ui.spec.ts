import { test, expect } from '@playwright/test';
import { generateRandomEmail, TEST_PASSWORDS, uniqueId } from '../fixtures/test-data';

test.describe('Módulo UI 01: Flujo de Autenticación & Registro', () => {
  const email = generateRandomEmail('ui_user');
  const password = TEST_PASSWORDS.ADMIN;
  const negocioNombre = `Lavanderia UI_${uniqueId()}`;
  const usuarioNombre = `Admin UI_${uniqueId()}`;

  test('Debe mostrar validaciones en el formulario de registro y registrar un nuevo negocio', async ({ page, request }) => {
    await page.goto('/register');

    // Verificar renderizado de elementos
    await expect(page.locator('h1')).toBeVisible();
    const submitBtn = page.getByRole('button', { name: /crear cuenta/i });
    await expect(submitBtn).toBeVisible();

    // Intentar enviar vacío y validar mensajes de error
    await submitBtn.click();
    await expect(page.locator('text=El nombre debe tener al menos 2 caracteres')).toBeVisible();

    // Completar el formulario
    await page.locator('#nombre').fill(usuarioNombre);
    await page.locator('#email').fill(email);
    await page.locator('#negocioNombre').fill(negocioNombre);
    await page.locator('#password').fill(password);

    await submitBtn.click();

    // Redirección a la pantalla de solicitud pendiente
    await expect(page).toHaveURL(/.*solicitud-pendiente.*/);
  });

  test('Debe iniciar sesión y redirigir al Dashboard de Admin con usuario verificado', async ({ page, request }) => {
    // Registramos y verificamos un usuario vía API para tenerlo listo
    const emailAdmin = generateRandomEmail('ui_admin_ready');
    const apiBase = process.env.API_URL || 'http://127.0.0.1:5001';
    const regRes = await request.post(`${apiBase}/api/auth/register`, {
      data: {
        negocioNombre: `Negocio_${uniqueId()}`,
        usuarioNombre: 'Admin Ready',
        email: emailAdmin,
        password: TEST_PASSWORDS.ADMIN
      }
    });
    const regData = await regRes.json();
    const code = regData.data?.verificationCode || regData.verificationCode;

    if (code) {
      await request.post(`${apiBase}/api/auth/verify-email`, {
        data: { email: emailAdmin, tokenConfirmacion: code }
      });
    }

    // Ir a la página de Login
    await page.goto('/login');
    await page.locator('#email').fill(emailAdmin);
    await page.locator('#password').fill(TEST_PASSWORDS.ADMIN);
    await page.getByRole('button', { name: /ingresar/i }).click();

    // Esperar redirección al panel de administración
    await expect(page).toHaveURL(/.*admin\/dashboard.*/);
  });
});
