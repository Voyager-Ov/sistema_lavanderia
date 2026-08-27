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

  test('2. [LIVE] Debe navegar a /admin/pedidos al hacer clic en el botón de enlace de "Pedidos del Día"', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });

    const linkPedidos = page.locator('main .grid a[href="/admin/pedidos"]').first();
    await expect(linkPedidos).toBeVisible({ timeout: 15000 });
    await linkPedidos.click();

    await expect(page).toHaveURL(/.*\/admin\/pedidos/, { timeout: 15000 });

    // Captura de pantalla de navegación
    await ScreenshotHelper.take(page, '02-dashboard-navegacion-pedidos-kpi', 'dashboard');
  });

  test('3. [LIVE] Debe navegar a /admin/caja al hacer clic en el botón de enlace de "Ingresos Hoy"', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });

    const linkCaja = page.locator('main .grid a[href="/admin/caja"]').first();
    await expect(linkCaja).toBeVisible({ timeout: 15000 });
    await linkCaja.click();

    await expect(page).toHaveURL(/.*\/admin\/caja/, { timeout: 15000 });

    // Captura de pantalla de navegación a caja
    await ScreenshotHelper.take(page, '03-dashboard-navegacion-caja-kpi', 'dashboard');
  });
});
