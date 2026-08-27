import { test, expect } from '@playwright/test';
import { generateSeedBusiness, generateSeedClients, generateSeedEmployees } from '../fixtures/seed-data';
import { E2ESeedHelper } from '../helpers/e2e-seed.helper';

test.describe('Módulo 4 & 5: Gestión de Empleados y Base de Clientes (+15 registros)', () => {
  test('debe sembrar empleados y 15+ clientes, validando la paginación de la tabla', async ({ page }) => {
    const businessData = generateSeedBusiness();
    const session = await E2ESeedHelper.registerAndApproveNewBusiness(page, businessData);

    const employees = generateSeedEmployees();
    const clients = generateSeedClients(15);

    // 1. Sembrar empleados y clientes
    const { createdEmployees, createdClients } = await E2ESeedHelper.seedEmployeesAndClientsViaApi(
      session.token,
      employees,
      clients
    );

    expect(createdEmployees.length).toBe(3);
    expect(createdClients.length).toBe(15);

    // 2. Probar la tabla de clientes y su paginación
    await E2ESeedHelper.testClientsTablePaginationUI(page);

    // 3. Navegar a /admin/empleados y verificar renderizado
    await page.goto('/admin/empleados', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText(/carlos cajero|marta lavandería|roberto encargado/i);
  });
});
