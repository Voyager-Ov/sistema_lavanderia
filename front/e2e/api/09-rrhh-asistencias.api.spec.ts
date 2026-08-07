import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';

test.describe('Módulo 09: API de RRHH & Fichaje de Asistencias', () => {
  let ctx: TenantWithEmpleadoContext;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);
  });

  test('POST /api/rrhh/asistencias/entrada - Empleado DEBE poder fichar entrada (201)', async ({ request }) => {
    const res = await request.post('/api/rrhh/asistencias/entrada', {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('POST /api/rrhh/asistencias/entrada - Debe fallar si ya tiene un turno abierto hoy (400)', async ({ request }) => {
    const res = await request.post('/api/rrhh/asistencias/entrada', {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(400);
  });

  test('POST /api/rrhh/asistencias/salida - Empleado DEBE poder fichar salida (200)', async ({ request }) => {
    const res = await request.post('/api/rrhh/asistencias/salida', {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('POST /api/rrhh/asistencias/salida - Debe fallar si NO tiene turno abierto (400)', async ({ request }) => {
    const res = await request.post('/api/rrhh/asistencias/salida', {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(400);
  });

  test('GET /api/rrhh/asistencias - Empleado puede ver su historial de asistencias (200)', async ({ request }) => {
    const res = await request.get('/api/rrhh/asistencias', {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('GET /api/rrhh/reportes/mensual - Admin DEBE poder ver el reporte mensual (200)', async ({ request }) => {
    const res = await request.get('/api/rrhh/reportes/mensual', {
      headers: ctx.headers
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('GET /api/rrhh/reportes/mensual - Empleado NO DEBE tener acceso al reporte de RRHH (403)', async ({ request }) => {
    const res = await request.get('/api/rrhh/reportes/mensual', {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(403);
  });
});
