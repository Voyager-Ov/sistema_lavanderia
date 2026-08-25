import { test, expect } from '@playwright/test';
import { LiveClientesHelper, LiveTenantSession } from '../helpers/live-clientes.helper';

test.describe('E2E Live: Ficha Integral del Cliente (/admin/clientes/[id])', () => {
  let session: LiveTenantSession;

  test.beforeAll(async () => {
    session = await LiveClientesHelper.setupLiveTenantAndAdmin();
  });

  test.beforeEach(async ({ page }) => {
    await LiveClientesHelper.injectLiveSession(page, session);
  });

  test('1. [LIVE] Debe renderizar el encabezado con nombre, estado Activo y tarjetas KPI', async ({ page }) => {
    const client = await LiveClientesHelper.createLiveClientViaApi(session.token, {
      nombre: `Detalle_${Date.now()}`,
      telefono: '1199881122',
      email: 'detalle@test.com'
    });

    await page.goto(`/admin/clientes/${client.id}`);

    // Encabezado
    await expect(page.getByRole('heading', { name: client.nombre })).toBeVisible();
    await expect(page.getByText('Activo')).toBeVisible();
    await expect(page.getByText('1199881122')).toBeVisible();

    // 4 Tarjetas KPI
    await expect(page.getByText('Total Gastado')).toBeVisible();
    await expect(page.getByText('Pedidos Totales')).toBeVisible();
    await expect(page.getByText('Ticket Promedio')).toBeVisible();
    await expect(page.getByText('Pedidos Activos')).toBeVisible();
  });

  test('2. [LIVE] Debe recargar la ficha viva al pulsar el botón "Actualizar"', async ({ page }) => {
    const client = await LiveClientesHelper.createLiveClientViaApi(session.token, {
      nombre: `Refresco_${Date.now()}`
    });

    await page.goto(`/admin/clientes/${client.id}`);

    const refreshBtn = page.getByRole('button', { name: /Actualizar/i });
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();

    await expect(page.getByRole('heading', { name: client.nombre })).toBeVisible();
  });

  test('3. [LIVE] Debe navegar a la edición al pulsar el botón "Editar"', async ({ page }) => {
    const client = await LiveClientesHelper.createLiveClientViaApi(session.token, {
      nombre: `ParaEditar_${Date.now()}`
    });

    await page.goto(`/admin/clientes/${client.id}`);

    const editBtn = page.getByRole('button', { name: /Editar/i });
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    await expect(page).toHaveURL(new RegExp(`.*\\/admin\\/clientes\\/${client.id}\\/editar`));
  });
});
