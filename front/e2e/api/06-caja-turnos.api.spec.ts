import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';

test.describe('Módulo 06: API de Caja, Turnos & Arqueo', () => {
  let ctx: TenantWithEmpleadoContext;
  let cajaId: number;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);
  });

  test('POST /api/cajas/abrir - Debe rechazar montoInicial negativo (400)', async ({ request }) => {
    const res = await request.post('/api/cajas/abrir', {
      headers: ctx.empleadoHeaders,
      data: {
        montoInicial: -500
      }
    });

    expect(res.status()).toBe(400);
  });

  test('POST /api/cajas/abrir - Empleado DEBE poder abrir caja con montoInicial (201)', async ({ request }) => {
    const res = await request.post('/api/cajas/abrir', {
      headers: ctx.empleadoHeaders,
      data: {
        montoInicial: 2000
      }
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.estado).toBe('ABIERTA');
    expect(parseFloat(body.data.montoInicial)).toBe(2000);

    cajaId = body.data.id;
  });

  test('POST /api/cajas/abrir - No debe permitir abrir otra caja si ya tiene una abierta (400)', async ({ request }) => {
    const res = await request.post('/api/cajas/abrir', {
      headers: ctx.empleadoHeaders,
      data: {
        montoInicial: 1000
      }
    });

    expect(res.status()).toBe(400);
  });

  test('GET /api/cajas/actual - Debe reflejar métricas en vivo precisas (200)', async ({ request }) => {
    const res = await request.get('/api/cajas/actual', {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.estado).toBe('ABIERTA');
    expect(body.data.efectivoEsperadoEnVivo).toBe(2000);
    expect(body.data.totalIngresosEnVivo).toBe(0);
    expect(body.data.totalEgresosEnVivo).toBe(0);
  });

  test('POST /api/cajas/:id/cerrar - Empleado DEBE poder cerrar su caja con arqueo (200)', async ({ request }) => {
    const res = await request.post(`/api/cajas/${cajaId}/cerrar`, {
      headers: ctx.empleadoHeaders,
      data: {
        efectivoReal: 2050 // Sobran 50
      }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.estado).toBe('CERRADA');
    expect(parseFloat(body.data.diferenciaEfectivo)).toBe(50);
  });

  test('POST /api/cajas/:id/cerrar - No debe permitir cerrar una caja ya cerrada (400)', async ({ request }) => {
    const res = await request.post(`/api/cajas/${cajaId}/cerrar`, {
      headers: ctx.empleadoHeaders,
      data: {
        efectivoReal: 2000
      }
    });

    expect(res.status()).toBe(400);
  });

  test('GET /api/cajas/historial - Debe listar historial de cajas (200)', async ({ request }) => {
    const res = await request.get('/api/cajas/historial', {
      headers: ctx.headers
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
