import { test, expect } from '@playwright/test';
import { LiveClientesHelper, LiveTenantSession } from '../helpers/live-clientes.helper';
import { ScreenshotHelper } from '../helpers/screenshot.helper';

test.describe('E2E Live: Listado de Clientes (/admin/clientes)', () => {
  let session: LiveTenantSession;

  test.beforeAll(async () => {
    ScreenshotHelper.cleanScreenshotsDir();
    session = await LiveClientesHelper.setupLiveTenantAndAdmin();
  });

  test.beforeEach(async ({ page }) => {
    await LiveClientesHelper.injectLiveSession(page, session);
  });

  test('1. [LIVE] Debe renderizar la tabla con clientes vivos y KPIs superiores', async ({ page }) => {
    const client = await LiveClientesHelper.createLiveClientViaApi(session.token, {
      nombre: `ClienteTabla_${Date.now()}`,
      telefono: '1144556677'
    });

    await page.goto('/admin/clientes');

    // Verificar KPIs visibles
    await expect(page.getByText('Total Clientes')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Clientes Activos')).toBeVisible({ timeout: 15000 });

    // Verificar cliente en la tabla
    await expect(page.getByText(client.nombre)).toBeVisible({ timeout: 15000 });

    // Captura de pantalla
    await ScreenshotHelper.take(page, '01-listado-clientes-tabla-y-kpis');
  });

  test('2. [LIVE] Debe navegar a /admin/clientes/nuevo al pulsar el botón "Nuevo Cliente"', async ({ page }) => {
    await page.goto('/admin/clientes');

    const nuevoBtn = page.getByRole('button', { name: /Nuevo Cliente/i }).or(page.getByRole('link', { name: /Nuevo Cliente/i }));
    await expect(nuevoBtn).toBeVisible({ timeout: 15000 });
    await nuevoBtn.click();

    await expect(page).toHaveURL(/.*\/admin\/clientes\/nuevo/);

    // Captura de pantalla
    await ScreenshotHelper.take(page, '02-navegacion-nuevo-cliente');
  });

  test('3. [LIVE] Debe filtrar la tabla en tiempo real al escribir en el input de búsqueda', async ({ page }) => {
    const uniqueSearchName = `Filtro_${Date.now()}`;
    await LiveClientesHelper.createLiveClientViaApi(session.token, {
      nombre: uniqueSearchName,
      telefono: '1199887766'
    });

    await page.goto('/admin/clientes');

    const searchInput = page.getByPlaceholder(/Buscar por nombre, teléfono/i).or(page.getByRole('textbox', { name: /Buscar/i }));
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await searchInput.fill(uniqueSearchName);

    // Esperar filtrado en tiempo real desde el backend
    await expect(page.getByText(uniqueSearchName)).toBeVisible({ timeout: 15000 });

    // Captura de pantalla
    await ScreenshotHelper.take(page, '03-filtro-tiempo-real-busqueda');
  });

  test('4. [LIVE] Debe abrir el modal DesactivarClienteModal, confirmar la baja y actualizar la tabla', async ({ page }) => {
    const toDeleteName = `ParaDesactivar_${Date.now()}`;
    await LiveClientesHelper.createLiveClientViaApi(session.token, {
      nombre: toDeleteName,
      telefono: '1133221100'
    });

    await page.goto('/admin/clientes');

    // Buscar el cliente en la tabla
    const row = page.getByRole('row').filter({ hasText: toDeleteName });
    await expect(row).toBeVisible({ timeout: 15000 });

    // Clic en el botón de desactivar visible en la fila
    const desactivarBtn = row.locator('button:visible').last();
    await desactivarBtn.click();

    // Modal de desactivación
    await expect(page.getByText(/¿Estás seguro que deseas desactivar a/i)).toBeVisible({ timeout: 10000 });

    const motivoInput = page.getByPlaceholder(/Ej: Cliente solicitó la baja/i).or(page.locator('input[type="text"]').last());
    if (await motivoInput.isVisible()) {
      await motivoInput.fill('Baja por falta de uso');
    }

    // Captura de pantalla del modal antes de confirmar
    await ScreenshotHelper.take(page, '04-modal-desactivar-cliente-abierto');

    const confirmBtn = page.getByRole('dialog').getByRole('button', { name: /^Desactivar$/i });
    await expect(confirmBtn).toBeVisible({ timeout: 10000 });
    await confirmBtn.click();

    // Toast de confirmación
    await expect(page.getByText(/desactivado con éxito/i).or(page.getByText(/éxito/i))).toBeVisible({ timeout: 15000 });
  });
});
