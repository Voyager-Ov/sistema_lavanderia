import { test, expect } from '@playwright/test';
import { LiveClientesHelper, LiveTenantSession } from '../helpers/live-clientes.helper';
import { ScreenshotHelper } from '../helpers/screenshot.helper';

test.describe('E2E Live: Cobro de Pedidos desde la Ficha del Cliente', () => {
  let session: LiveTenantSession;

  test.beforeAll(async () => {
    session = await LiveClientesHelper.setupLiveTenantAndAdmin();
  });

  test.beforeEach(async ({ page }) => {
    await LiveClientesHelper.injectLiveSession(page, session);
  });

  test('1. [LIVE] Debe renderizar la sección de historial de pedidos y estado vacío en cliente nuevo', async ({ page }) => {
    const client = await LiveClientesHelper.createLiveClientViaApi(session.token, {
      nombre: `CobroSheet_${Date.now()}`
    });

    await page.goto(`/admin/clientes/${client.id}`);

    // Comprobar la tabla de pedidos y el estado vacío
    await expect(page.getByText(/Ver en pedidos generales/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Sin pedidos registrados para este cliente/i)).toBeVisible({ timeout: 15000 });

    // Captura de pantalla del historial comercial vacío
    await ScreenshotHelper.take(page, '16-ficha-cliente-historial-pedidos-vacio');
  });
});
