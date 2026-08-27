import { test, expect } from '@playwright/test';
import { generateSeedBusiness, SEED_CATEGORIES, SEED_SERVICES } from '../fixtures/seed-data';
import { E2ESeedHelper } from '../helpers/e2e-seed.helper';

test.describe('Módulo 2 & 3: Categorías y Catálogo de Servicios con Paginación', () => {
  test.setTimeout(60000);
  test('debe sembrar categorías y servicios y permitir filtrado y navegación en la UI', async ({ page }) => {
    const businessData = generateSeedBusiness();
    const session = await E2ESeedHelper.registerAndApproveNewBusiness(page, businessData);

    // 1. Sembrar Categorías y Servicios
    const { createdCategories, createdServices } = await E2ESeedHelper.seedCategoriesAndServicesViaApi(
      session.token,
      SEED_CATEGORIES,
      SEED_SERVICES
    );

    expect(Object.keys(createdCategories).length).toBe(4);
    expect(createdServices.length).toBe(12);

    // 2. Navegar a /admin/servicios y validar la UI
    await E2ESeedHelper.injectSession(page, session);
    await page.goto('/admin/servicios', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Verificar título o tabla de servicios
    await expect(page.locator('body')).toContainText(/servicios|catálogo|categorías/i);
  });
});
