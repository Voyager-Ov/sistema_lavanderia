import { test, expect } from '@playwright/test';
import { LiveDashboardHelper, LiveDashboardSession } from '../helpers/live-dashboard.helper';
import { ScreenshotHelper } from '../helpers/screenshot.helper';

test.describe('E2E Live: Integración Reactiva con el Estado de Caja', () => {
  let session: LiveDashboardSession;

  test.beforeAll(async () => {
    session = await LiveDashboardHelper.setupLiveTenantAndAdmin();
  });

  test.beforeEach(async ({ page }) => {
    await LiveDashboardHelper.injectLiveSession(page, session);
  });

  test('1. [LIVE] Debe renderizar la tarjeta "Estado de Caja" con su estado actual', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20000 });

    await expect(page.getByText('Estado de Caja')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /(Abrir Caja|Ver Caja)/i })).toBeVisible({ timeout: 10000 });

    // Captura de pantalla del estado de caja
    await ScreenshotHelper.take(page, '07-dashboard-caja-cerrada', 'dashboard');
  });

  test('2. [LIVE] Debe navegar a /admin/caja al pulsar el botón de acción de caja', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20000 });

    const btnCaja = page.getByRole('button', { name: /(Abrir Caja|Ver Caja)/i });
    await expect(btnCaja).toBeVisible({ timeout: 15000 });
    await btnCaja.click();

    await expect(page).toHaveURL(/.*\/admin\/caja/, { timeout: 15000 });

    // Captura de pantalla tras navegación a caja
    await ScreenshotHelper.take(page, '08-dashboard-navegacion-caja', 'dashboard');
  });

  test('3. [LIVE] Debe reflejar "Turno en Curso" tras abrir una caja vía API', async ({ page }) => {
    // Abrir caja vía API si no está abierta
    await LiveDashboardHelper.openLiveCajaViaApi(session.token, 7500);

    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20000 });

    // Verificar que la tarjeta muestre Turno en Curso y Ver Caja
    await expect(page.getByText(/Turno en Curso/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /Ver Caja/i })).toBeVisible({ timeout: 10000 });

    // Captura de pantalla con caja abierta
    await ScreenshotHelper.take(page, '09-dashboard-caja-abierta-en-curso', 'dashboard');
  });
});
