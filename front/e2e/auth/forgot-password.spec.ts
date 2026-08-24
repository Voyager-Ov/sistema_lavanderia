import { test, expect } from '@playwright/test';
import { AuthMockHelper } from '../helpers/auth-mock.helper';

test.describe('E2E: Vista de Recuperar Contraseña (/forgot-password)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test('1. Debe validar el formato del correo electrónico', async ({ page }) => {
    await page.getByLabel('Tu email').fill('not-an-email');
    await page.getByRole('button', { name: 'Enviar enlace' }).click();

    await expect(page.getByText('Ingresa un correo electrónico válido')).toBeVisible();
  });

  test('2. Debe enviar enlace y transicionar a la tarjeta de confirmación', async ({ page }) => {
    await AuthMockHelper.mockForgotPasswordSuccess(page);

    await page.getByLabel('Tu email').fill('usuario@lavanderia.com');
    await page.getByRole('button', { name: 'Enviar enlace' }).click();

    await expect(page.getByText('¡Revisa tu correo!')).toBeVisible();
    await expect(page.getByText('Hemos enviado las instrucciones')).toBeVisible();
  });

  test('3. Debe permitir volver al formulario con "Intentar con otro correo"', async ({ page }) => {
    await AuthMockHelper.mockForgotPasswordSuccess(page);

    await page.getByLabel('Tu email').fill('usuario@lavanderia.com');
    await page.getByRole('button', { name: 'Enviar enlace' }).click();

    await expect(page.getByText('¡Revisa tu correo!')).toBeVisible();

    await page.getByRole('button', { name: 'Intentar con otro correo' }).click();
    await expect(page.getByLabel('Tu email')).toBeVisible();
  });
});
