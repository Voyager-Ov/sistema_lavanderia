import { test, expect } from '@playwright/test';
import { LiveDashboardHelper, LiveDashboardSession } from '../helpers/live-dashboard.helper';
import { ScreenshotHelper } from '../helpers/screenshot.helper';

test.describe('E2E Live: Gráficos de Analítica y Feed de Últimos Pedidos', () => {
  let session: LiveDashboardSession;

  test.beforeAll(async () => {
    session = await LiveDashboardHelper.setupLiveTenantAndAdmin();
  });

  test.beforeEach(async ({ page }) => {
    await LiveDashboardHelper.injectLiveSession(page, session);
  });

  test('1. [LIVE] Debe renderizar el gráfico "Ingresos por Día ($)" con los 7 días de la semana', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Verificar presencia del gráfico
    await expect(page.getByText(/Ingresos por Día/i)).toBeVisible({ timeout: 15000 });

    // Captura del gráfico de barras semanal
    await ScreenshotHelper.take(page, '04-dashboard-grafico-barras-semanal', 'dashboard');
  });

  test('2. [LIVE] Debe mostrar la lista de "Últimos Pedidos"', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Verificar sección de últimos pedidos
    await expect(page.getByText('Últimos Pedidos')).toBeVisible({ timeout: 15000 });

    // Captura de la lista de últimos pedidos
    await ScreenshotHelper.take(page, '05-dashboard-ultimos-pedidos-lista', 'dashboard');
  });

  test('3. [LIVE] Debe navegar a /admin/pedidos/nuevo al pulsar "+ Nuevo" en Últimos Pedidos', async ({ page }) => {
    await page.goto('/admin/dashboard');

    const btnNuevo = page.getByRole('button', { name: /\+ Nuevo/i });
    await expect(btnNuevo).toBeVisible({ timeout: 15000 });
    await btnNuevo.click();

    await expect(page).toHaveURL(/.*\/admin\/pedidos\/nuevo/);

    // Captura de navegación
    await ScreenshotHelper.take(page, '06-dashboard-navegacion-nuevo-pedido-desde-lista', 'dashboard');
  });
});
