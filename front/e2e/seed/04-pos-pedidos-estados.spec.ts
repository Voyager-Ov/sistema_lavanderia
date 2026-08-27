import { test, expect } from '@playwright/test';
import { generateSeedBusiness, generateSeedClients, SEED_CATEGORIES, SEED_SERVICES } from '../fixtures/seed-data';
import { E2ESeedHelper } from '../helpers/e2e-seed.helper';

test.describe('Módulo 6 & 7: Apertura de Caja, Pedidos POS y Transición de Estados', () => {
  test('debe abrir caja, registrar pedidos y moverlos por sus estados de taller', async ({ page }) => {
    const businessData = generateSeedBusiness();
    const session = await E2ESeedHelper.registerAndApproveNewBusiness(page, businessData);

    // 1. Sembrar catálogo y clientes
    const { createdServices } = await E2ESeedHelper.seedCategoriesAndServicesViaApi(
      session.token,
      SEED_CATEGORIES,
      SEED_SERVICES
    );
    const { createdClients } = await E2ESeedHelper.seedEmployeesAndClientsViaApi(
      session.token,
      [],
      generateSeedClients(8)
    );

    // 2. Abrir Caja
    const caja = await E2ESeedHelper.ensureCashRegisterOpen(session.token, 15000);
    expect(caja.estadoCaja).toBe('Abierta');

    // 3. Crear Pedidos y Hacerlos Avanzar por Estados
    const orders = await E2ESeedHelper.seedOrdersWithLifecycleViaApi(
      session.token,
      createdClients,
      createdServices
    );

    expect(orders.length).toBeGreaterThan(0);

    // 4. Navegar a /admin/pedidos en la UI
    await page.goto('/admin/pedidos', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText(/pedidos|ordenes|estado/i);
  });
});
