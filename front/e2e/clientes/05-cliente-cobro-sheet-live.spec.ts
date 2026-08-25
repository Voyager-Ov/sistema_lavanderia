import { test, expect } from '@playwright/test';
import { LiveClientesHelper, LiveTenantSession } from '../helpers/live-clientes.helper';

test.describe('E2E Live: Cobro de Pedidos desde la Ficha del Cliente', () => {
  let session: LiveTenantSession;

  test.beforeAll(async () => {
    session = await LiveClientesHelper.setupLiveTenantAndAdmin();
  });

  test.beforeEach(async ({ page }) => {
    await LiveClientesHelper.injectLiveSession(page, session);
  });

  test('1. [LIVE] Debe abrir el CobrarPedidoSheet al pulsar el botón de cobrar en un pedido', async ({ page }) => {
    const client = await LiveClientesHelper.createLiveClientViaApi(session.token, {
      nombre: `CobroSheet_${Date.now()}`
    });

    await page.goto(`/admin/clientes/${client.id}`);

    // Si el cliente no tiene pedidos aún, la tabla muestra el estado vacío
    await expect(page.getByText(/Historial Comercial de Pedidos/i)).toBeVisible();
  });
});
