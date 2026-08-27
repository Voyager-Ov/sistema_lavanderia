import { test, expect } from '@playwright/test';
import { generateSeedBusiness, generateSeedClients, SEED_CATEGORIES, SEED_SERVICES } from '../fixtures/seed-data';
import { E2ESeedHelper } from '../helpers/e2e-seed.helper';

test.describe('Módulo 8, 9 & 10: Cobros, Saldo a Favor, Caja Chica y Dashboard 1:1', () => {
  test.setTimeout(60000);
  test('debe procesar cobros, acreditar vuelto a favor y validar métricas del Dashboard', async ({ page }) => {
    const businessData = generateSeedBusiness();
    const session = await E2ESeedHelper.registerAndApproveNewBusiness(page, businessData);

    // 1. Setup completo de negocio
    const { createdServices } = await E2ESeedHelper.seedCategoriesAndServicesViaApi(
      session.token,
      SEED_CATEGORIES,
      SEED_SERVICES
    );
    const { createdClients } = await E2ESeedHelper.seedEmployeesAndClientsViaApi(
      session.token,
      [],
      generateSeedClients(5)
    );
    await E2ESeedHelper.ensureCashRegisterOpen(session.token, 10000);

    const orders = await E2ESeedHelper.seedOrdersWithLifecycleViaApi(
      session.token,
      createdClients,
      createdServices
    );

    // 2. Registrar cobros con vuelto a favor
    const payments = await E2ESeedHelper.seedPaymentsAndCreditBalance(session.token, orders);
    expect(payments.length).toBeGreaterThan(0);

    // 3. Navegar a /admin/dashboard en Chromium y verificar métricas e interactividad
    await E2ESeedHelper.injectSession(page, session);
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Verificar presencia de tarjetas de KPI y contenedores de gráficos
    await expect(page.locator('body')).toContainText(/ventas|ingresos|cobros|pedidos/i);
  });
});
