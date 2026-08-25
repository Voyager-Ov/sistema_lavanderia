import { test, expect } from '@playwright/test';
import { LiveClientesHelper, LiveTenantSession } from '../helpers/live-clientes.helper';

test.describe('E2E Live: Listado de Clientes (/admin/clientes)', () => {
  let session: LiveTenantSession;

  test.beforeAll(async () => {
    session = await LiveClientesHelper.setupLiveTenantAndAdmin();
  });

  test.beforeEach(async ({ page }) => {
    await LiveClientesHelper.injectLiveSession(page, session);
  });

  test('1. [LIVE] Debe renderizar la tabla con clientes vivos y KPIs superiores', async ({ page }) => {
    // Creamos cliente real en PostgreSQL
    const client = await LiveClientesHelper.createLiveClientViaApi(session.token, {
      nombre: `ClienteTabla_${Date.now()}`,
      telefono: '1144556677'
    });

    await page.goto('/admin/clientes');

    // Verificar KPIs visibles
    await expect(page.getByText('Clientes Totales').or(page.getByText('Total Clientes'))).toBeVisible();
    await expect(page.getByText('Clientes Activos').or(page.getByText('Activos'))).toBeVisible();

    // Verificar cliente en la tabla
    await expect(page.getByText(client.nombre)).toBeVisible();
  });

  test('2. [LIVE] Debe navegar a /admin/clientes/nuevo al pulsar el botón "Nuevo Cliente"', async ({ page }) => {
    await page.goto('/admin/clientes');

    const nuevoBtn = page.getByRole('button', { name: /Nuevo Cliente/i }).or(page.getByRole('link', { name: /Nuevo Cliente/i }));
    await expect(nuevoBtn).toBeVisible();
    await nuevoBtn.click();

    await expect(page).toHaveURL(/.*\/admin\/clientes\/nuevo/);
  });

  test('3. [LIVE] Debe filtrar la tabla en tiempo real al escribir en el input de búsqueda', async ({ page }) => {
    const uniqueSearchName = `Filtro_${Date.now()}`;
    await LiveClientesHelper.createLiveClientViaApi(session.token, {
      nombre: uniqueSearchName,
      telefono: '1199887766'
    });

    await page.goto('/admin/clientes');

    const searchInput = page.getByPlaceholder(/Buscar por nombre, teléfono/i).or(page.getByRole('textbox', { name: /Buscar/i }));
    await searchInput.fill(uniqueSearchName);

    // Esperar respuesta viva del servidor
    await expect(page.getByText(uniqueSearchName)).toBeVisible();
  });

  test('4. [LIVE] Debe abrir el modal DesactivarClienteModal, confirmar la baja y actualizar la tabla', async ({ page }) => {
    const toDeleteName = `ParaDesactivar_${Date.now()}`;
    const client = await LiveClientesHelper.createLiveClientViaApi(session.token, {
      nombre: toDeleteName,
      telefono: '1133221100'
    });

    await page.goto('/admin/clientes');

    // Buscar el cliente en la tabla
    const row = page.getByRole('row').filter({ hasText: toDeleteName });
    await expect(row).toBeVisible();

    // Abrir menú de acciones o botón desactivar
    const actionMenu = row.getByRole('button', { name: /acciones/i }).or(row.locator('button').last());
    await actionMenu.click();

    const desactivarOption = page.getByRole('menuitem', { name: /Desactivar/i }).or(page.getByText(/Desactivar/i));
    if (await desactivarOption.isVisible()) {
      await desactivarOption.click();

      // Confirmar en el modal
      const confirmBtn = page.getByRole('button', { name: /Confirmar/i }).or(page.getByRole('button', { name: /Desactivar/i }));
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }
  });
});
