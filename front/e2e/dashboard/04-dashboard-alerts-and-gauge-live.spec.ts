import { test, expect } from '@playwright/test';
import { LiveDashboardHelper, LiveDashboardSession } from '../helpers/live-dashboard.helper';
import { ScreenshotHelper } from '../helpers/screenshot.helper';

test.describe('E2E Live: Alertas Operativas y Medidor de Progreso Gauge', () => {
  let session: LiveDashboardSession;

  test.beforeAll(async () => {
    session = await LiveDashboardHelper.setupLiveTenantAndAdmin();
  });

  test.beforeEach(async ({ page }) => {
    await LiveDashboardHelper.injectLiveSession(page, session);
  });

  test('1. [LIVE] Debe renderizar la tarjeta de "Alertas (Pendientes)" con su estado correspondiente', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20000 });

    // Verificar sección de Alertas
    await expect(page.getByText('Alertas (Pendientes)')).toBeVisible({ timeout: 15000 });

    // Captura de pantalla de alertas
    await ScreenshotHelper.take(page, '10-dashboard-alertas-urgencia', 'dashboard');
  });

  test('2. [LIVE] Debe navegar a /admin/pedidos?estado=PENDIENTE al hacer clic en "Ir a Pedidos"', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20000 });

    const btnIrPedidos = page.getByRole('button', { name: /Ir a Pedidos/i });
    await expect(btnIrPedidos).toBeVisible({ timeout: 15000 });
    await btnIrPedidos.click();

    await expect(page).toHaveURL(/.*\/admin\/pedidos.*/, { timeout: 15000 });

    // Captura de pantalla de navegación
    await ScreenshotHelper.take(page, '11-dashboard-navegacion-pedidos-pendientes', 'dashboard');
  });

  test('3. [LIVE] Debe renderizar el componente "Progreso del Día" (DashboardGauge)', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20000 });

    // Verificar componente Gauge
    await expect(page.getByText('Progreso del Día')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Pedidos entregados vs recibidos hoy/i)).toBeVisible({ timeout: 10000 });

    // Captura de pantalla del medidor de progreso
    await ScreenshotHelper.take(page, '12-dashboard-progreso-gauge', 'dashboard');
  });
});
