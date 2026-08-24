import { test, expect } from '@playwright/test';
import { AuthMockHelper } from '../helpers/auth-mock.helper';

test.describe('E2E: Vista de Restablecer Contraseña (/reset-password)', () => {
  test('1. Debe redirigir a /login si no se proporciona un token en la URL', async ({ page }) => {
    await page.goto('/reset-password');

    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByText('Enlace inválido').first()).toBeVisible();
  });

  test('2. Debe validar que las contraseñas coincidan y tengan al menos 8 caracteres', async ({ page }) => {
    await page.goto('/reset-password?token=valid_test_token_123');

    await page.getByLabel('Nueva contraseña').fill('Pass123');
    await page.getByLabel('Confirmar contraseña').fill('Pass456');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();

    await expect(page.getByText('La contraseña debe tener al menos 8 caracteres')).toBeVisible();
    await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible();
  });

  test('3. Debe restablecer la contraseña exitosamente', async ({ page }) => {
    await AuthMockHelper.mockResetPasswordSuccess(page);

    await page.goto('/reset-password?token=valid_test_token_123&email=user%40test.com');

    await page.getByLabel('Nueva contraseña').fill('BrandNewPassword123!');
    await page.getByLabel('Confirmar contraseña').fill('BrandNewPassword123!');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();

    await expect(page.getByText('¡Todo listo!')).toBeVisible();
    await expect(page.getByText('Contraseña actualizada exitosamente')).toBeVisible();
  });

  test('4. Debe mostrar error si el token expiró', async ({ page }) => {
    await AuthMockHelper.mockResetPasswordError(page, 'El enlace de restablecimiento ha expirado.');

    await page.goto('/reset-password?token=expired_token_123');

    await page.getByLabel('Nueva contraseña').fill('BrandNewPassword123!');
    await page.getByLabel('Confirmar contraseña').fill('BrandNewPassword123!');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();

    await expect(page.getByText('Error al restablecer contraseña')).toBeVisible();
    await expect(page.getByText('El enlace de restablecimiento ha expirado.')).toBeVisible();
  });
});
