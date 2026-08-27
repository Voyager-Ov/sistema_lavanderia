import { test, expect } from '@playwright/test';
import { generateSeedBusiness, generateSeedClients, generateSeedEmployees, SEED_CATEGORIES, SEED_SERVICES } from '../fixtures/seed-data';
import { E2ESeedHelper } from '../helpers/e2e-seed.helper';

test.describe('MASTER E2E INTEGRATION & SEED SUITE (Chromium Headed)', () => {
  test.setTimeout(180000); // 3 minutos para el flujo completo en vivo

  test('Ejecución integradora 1:1 de los 10 módulos desde negocio recién creado', async ({ page }) => {
    console.log('🚀 Iniciando Módulo 1: Registro de Negocio y Auth...');
    const businessData = generateSeedBusiness();
    const session = await E2ESeedHelper.registerAndApproveNewBusiness(page, businessData);

    console.log(`✅ Negocio Registrado: "${businessData.negocioNombre}" (ID: ${session.negocioId})`);
    expect(session.negocioId).toBeGreaterThan(0);

    console.log('📦 Iniciando Módulo 2 & 3: Creación de Categorías y Catálogo de Servicios...');
    const { createdCategories, createdServices } = await E2ESeedHelper.seedCategoriesAndServicesViaApi(
      session.token,
      SEED_CATEGORIES,
      SEED_SERVICES
    );
    console.log(`✅ ${Object.keys(createdCategories).length} Categorías y ${createdServices.length} Servicios creados.`);

    console.log('👥 Iniciando Módulo 4 & 5: Alta de Empleados y Base de 15 Clientes...');
    const employees = generateSeedEmployees();
    const clients = generateSeedClients(15);
    const { createdEmployees, createdClients } = await E2ESeedHelper.seedEmployeesAndClientsViaApi(
      session.token,
      employees,
      clients
    );
    console.log(`✅ ${createdEmployees.length} Empleados y ${createdClients.length} Clientes registrados.`);

    console.log('📑 Probando UI de Tabla de Clientes y Paginado...');
    await E2ESeedHelper.testClientsTablePaginationUI(page);

    console.log('💵 Iniciando Módulo 6: Apertura de Caja y Turno...');
    const caja = await E2ESeedHelper.ensureCashRegisterOpen(session.token, 20000);
    console.log(`✅ Caja Turno Abierta (ID: ${caja.idCaja}, Monto Inicial: $${caja.montoInicial})`);

    console.log('🧺 Iniciando Módulo 7: Registro de Pedidos POS y Transición de Estados de Taller...');
    const orders = await E2ESeedHelper.seedOrdersWithLifecycleViaApi(
      session.token,
      createdClients,
      createdServices
    );
    console.log(`✅ ${orders.length} Pedidos creados y procesados por sus estados.`);

    console.log('💳 Iniciando Módulo 8: Cobros Atómicos y Saldo a Favor...');
    const payments = await E2ESeedHelper.seedPaymentsAndCreditBalance(session.token, orders);
    console.log(`✅ ${payments.length} Transacciones de cobro procesadas.`);

    console.log('📊 Iniciando Módulo 10: Verificación Final en Dashboard & Reportes...');
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Validar tarjetas de métricas
    await expect(page.locator('body')).toContainText(/ventas|ingresos|cobros/i);
    
    console.log('🎉 Suite E2E y Sembrado de Negocio finalizado con éxito 1:1!');
  });
});
