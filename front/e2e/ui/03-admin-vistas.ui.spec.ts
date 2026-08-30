import { test, expect } from '@playwright/test';
import { createTenantAdmin, injectAuthState, TenantAdminContext } from '../fixtures/auth.fixture';

test.describe('Módulo UI 03: Vistas y Navegación del Panel de Administración', () => {
  let ctx: TenantAdminContext;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantAdmin(request);
  });

  test('Debe cargar el Dashboard de Administración con botones de acción y KPIs', async ({ page }) => {
    await injectAuthState(page, ctx.admin, ctx.token);
    await page.goto('/admin/dashboard');

    // Verificar heading exacto del Dashboard Admin
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
    
    // Botón de acción rápido
    await expect(page.getByRole('button', { name: /Crear Pedido/i })).toBeVisible();

    // KPI principal del Dashboard
    await expect(page.locator('text=Pedidos del Día').first()).toBeVisible();
    await expect(page.locator('text=Ingresos Hoy').first()).toBeVisible();
  });

  test('Debe cargar el módulo de Clientes de Administración con el directorio', async ({ page }) => {
    await injectAuthState(page, ctx.admin, ctx.token);
    await page.goto('/admin/clientes');

    await expect(page.getByRole('heading', { name: /Directorio de Clientes/i, level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /Nuevo Cliente/i })).toBeVisible();
  });

  test('Debe cargar el módulo de Servicios y Categorías de Administración', async ({ page }) => {
    await injectAuthState(page, ctx.admin, ctx.token);
    await page.goto('/admin/servicios');

    await expect(page.getByRole('heading', { name: 'Servicios', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /Categorías/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Nuevo Servicio/i })).toBeVisible();
  });

  test('Debe cargar el módulo de Pedidos de Administración con filtros de fecha', async ({ page }) => {
    await injectAuthState(page, ctx.admin, ctx.token);
    await page.goto('/admin/pedidos');

    await expect(page.getByRole('heading', { name: 'Pedidos', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /Crear Nuevo Pedido/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Filtrar por Fecha/i })).toBeVisible();
  });

  test('Debe cargar el módulo de Configuración con el menú de navegación lateral', async ({ page }) => {
    await injectAuthState(page, ctx.admin, ctx.token);
    await page.goto('/admin/configuraciones');

    // Verificar ítems de la navegación lateral del módulo de configuración
    await expect(page.locator('button:has-text("Negocio")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Pagos")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Hardware y Tickets")').first()).toBeVisible();
  });
});

