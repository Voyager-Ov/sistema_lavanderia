import { test, expect } from '@playwright/test';

test.describe('E2E: Vista de Solicitud Pendiente (/solicitud-pendiente)', () => {
  test('1. Debe mostrar estado PENDIENTE con datos del negocio y solicitante', async ({ page }) => {
    await page.goto('/solicitud-pendiente?email=test%40lavanderia.com&negocio=Lavanderia%20Burbujas&status=PENDIENTE');

    await expect(page.getByText('Solicitud en Revisión')).toBeVisible();
    await expect(page.getByText('Lavanderia Burbujas')).toBeVisible();
    await expect(page.getByText('test@lavanderia.com')).toBeVisible();
    await expect(page.getByText('Pendiente de Aprobación')).toBeVisible();
  });

  test('2. Debe mostrar estado RECHAZADO con motivo explícito', async ({ page }) => {
    await page.goto('/solicitud-pendiente?email=rechazado%40lavanderia.com&negocio=Lavanderia%20Rechazada&status=RECHAZADO&motivo=Documentacion%20incompleta');

    await expect(page.getByText('Solicitud Rechazada')).toBeVisible();
    await expect(page.getByText('Rechazada', { exact: true })).toBeVisible();
    await expect(page.getByText('Documentacion incompleta')).toBeVisible();
  });

  test('3. Debe contener enlace funcional para volver al login', async ({ page }) => {
    await page.goto('/solicitud-pendiente');

    const backButton = page.getByRole('link', { name: 'Volver al Inicio de Sesión' });
    await expect(backButton).toBeVisible();
    await backButton.click();

    await expect(page).toHaveURL(/.*\/login/);
  });
});
