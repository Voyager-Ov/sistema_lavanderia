import { test, expect } from '@playwright/test';
import { generateSeedBusiness } from '../fixtures/seed-data';
import { E2ESeedHelper } from '../helpers/e2e-seed.helper';

test.describe('Módulo 1: Registro de Negocio y Autenticación 100% desde cero', () => {
  test('debe registrar un nuevo negocio en /register, aprobarlo e ingresar al dashboard', async ({ page }) => {
    const businessData = generateSeedBusiness();

    // 1. Ejecutar el flujo de registro y aprobación
    const session = await E2ESeedHelper.registerAndApproveNewBusiness(page, businessData);

    // 2. Verificar datos de sesión y tenant aislado
    expect(session.token).toBeTruthy();
    expect(session.negocioId).toBeGreaterThan(0);
    expect(session.usuario.email).toBe(businessData.email);

    // 3. Verificar que la UI muestra la pantalla principal del Dashboard
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/.*\/admin\/dashboard/);

    // Guardar token y negocioId para pruebas subsiguientes
    process.env.E2E_SEED_TOKEN = session.token;
    process.env.E2E_SEED_NEGOCIO_ID = String(session.negocioId);
  });
});
