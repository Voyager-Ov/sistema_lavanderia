import { test, expect } from '@playwright/test';
import { LiveClientesHelper, LiveTenantSession } from '../helpers/live-clientes.helper';

test.describe('E2E Live: Alta de Cliente (/admin/clientes/nuevo)', () => {
  let session: LiveTenantSession;

  test.beforeAll(async () => {
    session = await LiveClientesHelper.setupLiveTenantAndAdmin();
  });

  test.beforeEach(async ({ page }) => {
    await LiveClientesHelper.injectLiveSession(page, session);
    await page.goto('/admin/clientes/nuevo');
  });

  test('1. [LIVE] Debe bloquear el submit y mostrar toast si el nombre está vacío', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /Crear Cliente/i });
    await submitBtn.click();

    // El input HTML5 o Toast de validación se dispara
    await expect(page.getByText(/El nombre es obligatorio/i).or(page.locator('input:invalid'))).toBeVisible();
  });

  test('2. [LIVE] Debe regresar al listado al hacer clic en "Cancelar"', async ({ page }) => {
    const cancelBtn = page.getByRole('button', { name: /Cancelar/i });
    await cancelBtn.click();

    await expect(page).toHaveURL(/.*\/admin\/clientes/);
  });

  test('3. [LIVE] Debe crear un cliente real en PostgreSQL y redirigir con toast de éxito', async ({ page }) => {
    const uniqueClientName = `ClienteNuevo_${Date.now()}`;

    await page.getByPlaceholder(/Ej: Juan Pérez/i).fill(uniqueClientName);
    await page.getByPlaceholder(/Ej: 3811234567/i).fill('1133445566');
    await page.getByPlaceholder(/Ej: juan@email.com/i).fill(`nuevo_${Date.now()}@test.com`);

    await page.getByRole('button', { name: /Crear Cliente/i }).click();

    // Toast de éxito y redirección viva
    await expect(page.getByText(/¡Cliente creado con éxito!/i).or(page.getByText(/creado/i))).toBeVisible();
    await expect(page).toHaveURL(/.*\/admin\/clientes/);

    // Comprobar que aparece en la tabla
    await expect(page.getByText(uniqueClientName)).toBeVisible();
  });
});
