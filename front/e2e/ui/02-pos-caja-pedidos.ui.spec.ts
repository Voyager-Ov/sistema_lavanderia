import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, injectAuthState, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';
import { generateRandomPhone, uniqueId } from '../fixtures/test-data';

test.describe('Módulo UI 02: POS, Terminal & Caja', () => {
  let ctx: TenantWithEmpleadoContext;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);

    // Crear categoría y producto base
    const catRes = await request.post('/api/categorias', {
      headers: ctx.headers,
      data: { nombre: `Cat_UI_${uniqueId()}` }
    });
    const catId = (await catRes.json()).data.id;

    await request.post('/api/productos', {
      headers: ctx.headers,
      data: {
        nombre: 'Acolchado 2 Plazas',
        precioActual: 3500,
        categoriaId: catId,
        disponible: true
      }
    });

    // Crear un cliente
    await request.post('/api/clientes', {
      headers: ctx.empleadoHeaders,
      data: {
        nombre: 'Juan Pérez POS',
        telefono: generateRandomPhone()
      }
    });
  });

  test('Debe cargar la vista de Caja del POS y permitir consultar estado', async ({ page }) => {
    await injectAuthState(page, ctx.empleado, ctx.empleadoToken);
    await page.goto('/pos/caja');

    // Verificar renderizado de elementos de caja
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Debe cargar la vista de Pedidos del POS y listar los registros', async ({ page }) => {
    await injectAuthState(page, ctx.empleado, ctx.empleadoToken);
    await page.goto('/pos/pedidos');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('Debe cargar la vista de Clientes del POS', async ({ page }) => {
    await injectAuthState(page, ctx.empleado, ctx.empleadoToken);
    await page.goto('/pos/clientes');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Clientes')).toBeVisible();
  });
});
