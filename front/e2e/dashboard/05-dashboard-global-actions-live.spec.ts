import { test, expect } from '@playwright/test';
import { LiveDashboardHelper, LiveDashboardSession } from '../helpers/live-dashboard.helper';
import { ScreenshotHelper } from '../helpers/screenshot.helper';

test.describe('E2E Live: Acciones Globales del Encabezado y Recarga', () => {
  let session: LiveDashboardSession;

  test.beforeAll(async () => {
    session = await LiveDashboardHelper.setupLiveTenantAndAdmin();
  });

  test.beforeEach(async ({ page }) => {
    await LiveDashboardHelper.injectLiveSession(page, session);
  });

  test('1. [LIVE] Debe navegar a /admin/pedidos/nuevo al pulsar el botón principal "Crear Pedido"', async ({ page }) => {
    await page.goto('/admin/dashboard');

    const btnCrear = page.getByRole('button', { name: /Crear Pedido/i });
    await expect(btnCrear).toBeVisible({ timeout: 15000 });
    await btnCrear.click();

    await expect(page).toHaveURL(/.*\/admin\/pedidos\/nuevo/);

    // Captura de navegación al alta de pedido
    await ScreenshotHelper.take(page, '13-dashboard-header-crear-pedido', 'dashboard');
  });

  test('2. [LIVE] Debe renderizar correctamente todos los componentes tras recarga en vivo', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Recargar página
    await page.reload();

    // Esperar fin de carga y animación
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Pedidos del Día')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Estado de Caja')).toBeVisible({ timeout: 10000 });

    // Captura completa de la vista consolidada
    await ScreenshotHelper.take(page, '14-dashboard-vista-completa-final', 'dashboard');
  });
});
