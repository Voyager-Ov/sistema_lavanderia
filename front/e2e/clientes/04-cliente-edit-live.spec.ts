import { test, expect } from '@playwright/test';
import { LiveClientesHelper, LiveTenantSession } from '../helpers/live-clientes.helper';
import { ScreenshotHelper } from '../helpers/screenshot.helper';

test.describe('E2E Live: Edición de Cliente (/admin/clientes/[id]/editar)', () => {
  let session: LiveTenantSession;

  test.beforeAll(async () => {
    session = await LiveClientesHelper.setupLiveTenantAndAdmin();
  });

  test.beforeEach(async ({ page }) => {
    await LiveClientesHelper.injectLiveSession(page, session);
  });

  test('1. [LIVE] Debe precargar los datos reales, actualizar en DB y volver a la ficha', async ({ page }) => {
    const originalName = `Original_${Date.now()}`;
    const client = await LiveClientesHelper.createLiveClientViaApi(session.token, {
      nombre: originalName,
      telefono: '1100000000',
      email: 'original@test.com'
    });

    await page.goto(`/admin/clientes/${client.id}/editar`);

    // Comprobar precarga
    const nameInput = page.getByPlaceholder(/Nombre del cliente/i);
    await expect(nameInput).toHaveValue(originalName, { timeout: 15000 });

    // Captura del formulario con datos precargados
    await ScreenshotHelper.take(page, '12-edicion-cliente-datos-precargados');

    // Modificar datos
    const updatedName = `Modificado_${Date.now()}`;
    await nameInput.fill(updatedName);

    const phoneInput = page.getByPlaceholder(/Ej: 11 1234 5678/i);
    await phoneInput.fill('1188889999');

    // Captura del formulario con nuevos datos
    await ScreenshotHelper.take(page, '13-edicion-cliente-modificado-antes-guardar');

    await page.getByRole('button', { name: /Guardar Cambios/i }).click();

    // Confirmación y redirección
    await expect(page.getByText(/Cliente actualizado correctamente/i)).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(new RegExp(`.*\\/admin\\/clientes\\/${client.id}`));

    // Comprobar teléfono o nombre actualizado
    await expect(page.getByText('1188889999').or(page.getByText(updatedName))).toBeVisible({ timeout: 15000 });

    // Captura de la ficha actualizada
    await ScreenshotHelper.take(page, '14-ficha-cliente-datos-actualizados');
  });

  test('2. [LIVE] Debe cancelar la edición y volver a la ficha del cliente', async ({ page }) => {
    const client = await LiveClientesHelper.createLiveClientViaApi(session.token, {
      nombre: `CancelTest_${Date.now()}`
    });

    await page.goto(`/admin/clientes/${client.id}/editar`);

    const cancelBtn = page.getByRole('button', { name: /Cancelar/i });
    await expect(cancelBtn).toBeVisible({ timeout: 15000 });
    await cancelBtn.click();

    await expect(page).toHaveURL(new RegExp(`.*\\/admin\\/clientes\\/${client.id}`));

    // Captura tras cancelar
    await ScreenshotHelper.take(page, '15-edicion-cancelada-retorno-a-ficha');
  });
});
