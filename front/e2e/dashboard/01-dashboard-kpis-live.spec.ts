import { test, expect } from '@playwright/test';
import { LiveDashboardHelper, LiveDashboardSession } from '../helpers/live-dashboard.helper';
import { ScreenshotHelper } from '../helpers/screenshot.helper';

test.describe('E2E Live: Dashboard Principal y KPIs Superiores (/admin/dashboard)', () => {
  let session: LiveDashboardSession;

  test.beforeAll(async () => {
    ScreenshotHelper.cleanScreenshotsDir('dashboard');
    session = await LiveDashboardHelper.setupLiveTenantAndAdmin();
  });

  test.beforeEach(async ({ page }) => {
    await LiveDashboardHelper.injectLiveSession(page, session);
  });

  test('1. [LIVE] Debe renderizar el encabezado y las 4 tarjetas KPI con datos reales', async ({ page }) => {
    await page.goto('/admin/dashboard');

    // Verificar título principal
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });

    // Verificar las 4 tarjetas KPI
    await expect(page.getByText('Pedidos del Día')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Ingresos Hoy')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Servicios Activos')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Entregas Pend.')).toBeVisible({ timeout: 10000 });

    // Captura de pantalla de la vista principal con KPIs
    await ScreenshotHelper.take(page, '01-dashboard-kpis-y-metricas', 'dashboard');
  });

  test('2. [LIVE] Debe navegar a /admin/pedidos al hacer clic en el KPI "Pedidos del Día"', async ({ page }) => {
    await page.goto('/admin/dashboard');

    const kpiPedidos = page.getByText('Pedidos del Día');
    await expect(kpiPedidos).toBeVisible({ timeout: 15000 });
    await kpiPedidos.click();

    await expect(page).toHaveURL(/.*\/admin\/pedidos/);

    // Captura de pantalla de navegación
    await ScreenshotHelper.take(page, '02-dashboard-navegacion-pedidos-kpi', 'dashboard');
  });

  test('3. [LIVE] Debe navegar a /admin/caja al hacer clic en el KPI "Ingresos Hoy"', async ({ page }) => {
    await page.goto('/admin/dashboard');

    const kpiIngresos = page.getByText('Ingresos Hoy');
    await expect(kpiIngresos).toBeVisible({ timeout: 15000 });
    await kpiIngresos.click();

    await expect(page).toHaveURL(/.*\/admin\/caja/);

    // Captura de pantalla de navegación a caja
    await ScreenshotHelper.take(page, '03-dashboard-navegacion-caja-kpi', 'dashboard');
  });
});
