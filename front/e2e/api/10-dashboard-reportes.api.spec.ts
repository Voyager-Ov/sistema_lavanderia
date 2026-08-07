import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';

test.describe('Módulo 10: API de Dashboard & Reportes', () => {
  let ctx: TenantWithEmpleadoContext;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);
  });

  test('GET /api/dashboard/stats - Debe obtener estadísticas principales del negocio (200)', async ({ request }) => {
    const res = await request.get('/api/dashboard/stats', {
      headers: ctx.headers
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toBeDefined();
  });

  test('GET /api/reportes/servicios - Admin DEBE poder consultar reporte de servicios (200)', async ({ request }) => {
    const res = await request.get('/api/reportes/servicios', {
      headers: ctx.headers
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('GET /api/reportes/servicios - Empleado NO DEBE poder consultar reportes ejecutivos (403)', async ({ request }) => {
    const res = await request.get('/api/reportes/servicios', {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(403);
  });
});
