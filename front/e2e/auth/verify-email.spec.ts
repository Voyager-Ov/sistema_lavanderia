import { test, expect } from '@playwright/test';
import { AuthMockHelper } from '../helpers/auth-mock.helper';

test.describe('E2E: Vista de Verificación de Email (/verify-email)', () => {
  test('1. Debe leer automáticamente los parámetros de URL (?email=&token=)', async ({ page }) => {
    await page.goto('/verify-email?email=test%40lavanderia.com&token=654321');

    await expect(page.getByPlaceholder('Código de 6 dígitos')).toHaveValue('654321');
    await expect(page.getByText('Ingresa el código enviado a test@lavanderia.com')).toBeVisible();
  });

  test('2. Debe verificar cuenta exitosamente y redirigir a /login', async ({ page }) => {
    await AuthMockHelper.mockVerifyEmailSuccess(page);

    await page.goto('/verify-email?email=test%40lavanderia.com&token=123456');
    await page.getByRole('button', { name: 'Verificar cuenta' }).click();

    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByText('¡Email verificado!')).toBeVisible();
  });

  test('3. Debe permitir reenviar código de verificación', async ({ page }) => {
    await AuthMockHelper.mockResendVerificationSuccess(page);

    await page.goto('/verify-email?email=test%40lavanderia.com');
    await page.getByRole('button', { name: 'Reenviar código' }).click();

    await expect(page.getByText('Código reenviado')).toBeVisible();
  });

  test('4. Debe mostrar error visual si el código es inválido', async ({ page }) => {
    await AuthMockHelper.mockVerifyEmailError(page, 'El código de verificación es incorrecto.');

    await page.goto('/verify-email?email=test%40lavanderia.com&token=000000');
    await page.getByRole('button', { name: 'Verificar cuenta' }).click();

    await expect(page.getByText('Error al verificar')).toBeVisible();
    await expect(page.getByText('El código de verificación es incorrecto.')).toBeVisible();
  });
});
