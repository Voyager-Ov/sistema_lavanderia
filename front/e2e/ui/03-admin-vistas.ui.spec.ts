import { test, expect } from '@playwright/test';
import { createTenantAdmin, injectAuthState, TenantAdminContext } from '../fixtures/auth.fixture';

test.describe('Módulo UI 03: Vistas y Navegación del Panel de Administración', () => {
  let ctx: TenantAdminContext;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantAdmin(request);
  });

  test('Debe cargar el Dashboard de Administración con métricas', async ({ page }) => {
    await injectAuthState(page, ctx.admin, ctx.token);
    await page.goto('/admin/dashboard');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('Debe cargar el módulo de Clientes de Administración', async ({ page }) => {
    await injectAuthState(page, ctx.admin, ctx.token);
    await page.goto('/admin/clientes');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Clientes')).toBeVisible();
  });

  test('Debe cargar el módulo de Servicios y Categorías de Administración', async ({ page }) => {
    await injectAuthState(page, ctx.admin, ctx.token);
    await page.goto('/admin/servicios');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Servicios')).toBeVisible();
  });

  test('Debe cargar el módulo de Pedidos de Administración', async ({ page }) => {
    await injectAuthState(page, ctx.admin, ctx.token);
    await page.goto('/admin/pedidos');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Pedidos')).toBeVisible();
  });

  test('Debe cargar el módulo de Configuración de Administración', async ({ page }) => {
    await injectAuthState(page, ctx.admin, ctx.token);
    await page.goto('/admin/configuraciones');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Configuración')).toBeVisible();
  });
});
