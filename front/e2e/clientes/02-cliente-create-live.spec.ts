import { test, expect } from '@playwright/test';
import { LiveClientesHelper, LiveTenantSession } from '../helpers/live-clientes.helper';
import { ScreenshotHelper } from '../helpers/screenshot.helper';

test.describe('E2E Live: Alta de Cliente (/admin/clientes/nuevo)', () => {
  let session: LiveTenantSession;

  test.beforeAll(async () => {
    session = await LiveClientesHelper.setupLiveTenantAndAdmin();
  });

  test.beforeEach(async ({ page }) => {
    await LiveClientesHelper.injectLiveSession(page, session);
  });

  test('1. [LIVE] Debe bloquear el submit y mostrar toast si el nombre está vacío', async ({ page }) => {
    await page.goto('/admin/clientes/nuevo');
    const submitBtn = page.getByRole('button', { name: /Crear Cliente/i });
    await expect(submitBtn).toBeVisible({ timeout: 15000 });
    await submitBtn.click();

    await expect(page.getByText(/El nombre es obligatorio/i).or(page.locator('input:invalid'))).toBeVisible({ timeout: 10000 });

    // Captura de pantalla
    await ScreenshotHelper.take(page, '05-alta-cliente-validacion-error');
  });

  test('2. [LIVE] Debe regresar al listado al hacer clic en "Cancelar"', async ({ page }) => {
    await page.goto('/admin/clientes');
    const nuevoBtn = page.getByRole('button', { name: /Nuevo Cliente/i }).or(page.getByRole('link', { name: /Nuevo Cliente/i }));
    await expect(nuevoBtn).toBeVisible({ timeout: 15000 });
    await nuevoBtn.click();
    await expect(page).toHaveURL(/.*\/admin\/clientes\/nuevo/);

    const cancelBtn = page.getByRole('button', { name: /Cancelar/i });
    await expect(cancelBtn).toBeVisible({ timeout: 15000 });
    
    // Captura de pantalla antes de cancelar
    await ScreenshotHelper.take(page, '06-alta-cliente-formulario-cancelar');

    await cancelBtn.click();
    await expect(page).toHaveURL(/.*\/admin\/clientes/);
  });

  test('3. [LIVE] Debe crear un cliente real en PostgreSQL y redirigir con toast de éxito', async ({ page }) => {
    await page.goto('/admin/clientes/nuevo');
    const uniqueClientName = `ClienteNuevo_${Date.now()}`;

    const nameInput = page.getByPlaceholder(/Ej: Juan Pérez/i);
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill(uniqueClientName);

    await page.getByPlaceholder(/Ej: 3811234567/i).fill('1133445566');
    await page.getByPlaceholder(/Ej: juan@email.com/i).fill(`nuevo_${Date.now()}@test.com`);

    // Captura del formulario completado
    await ScreenshotHelper.take(page, '07-alta-cliente-formulario-lleno');

    await page.getByRole('button', { name: /Crear Cliente/i }).click();

    // Toast de éxito y redirección viva
    await expect(page.getByText(/¡Cliente creado con éxito!/i).or(page.getByText(/creado/i))).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/.*\/admin\/clientes/);

    // Comprobar que aparece en la tabla
    await expect(page.getByText(uniqueClientName)).toBeVisible({ timeout: 15000 });

    // Captura del listado con el cliente recién creado
    await ScreenshotHelper.take(page, '08-alta-cliente-creado-en-tabla');
  });
});
