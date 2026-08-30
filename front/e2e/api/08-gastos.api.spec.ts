import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';

test.describe('Módulo 08: API de Gastos & Categorías de Egreso', () => {
  let ctx: TenantWithEmpleadoContext;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);
  });

  test('POST /api/gastos - Debe rechazar registrar gasto si NO hay caja abierta (400)', async ({ request }) => {
    const res = await request.post('/api/gastos', {
      headers: ctx.empleadoHeaders,
      data: {
        monto: 300,
        categoria: 'Insumos',
        descripcion: 'Detergente'
      }
    });

    expect(res.status()).toBe(400);
  });

  test('POST /api/gastos - Empleado NO DEBE poder registrar gastos de "Nomina" (403)', async ({ request }) => {
    // Abrir caja
    await request.post('/api/cajas/abrir', {
      headers: ctx.empleadoHeaders,
      data: { montoInicial: 1500 }
    });

    const res = await request.post('/api/gastos', {
      headers: ctx.empleadoHeaders,
      data: {
        monto: 1000,
        categoria: 'Nomina',
        descripcion: 'Adelanto de sueldo'
      }
    });

    expect(res.status()).toBe(403);
  });

  test('POST /api/gastos - Empleado DEBE poder registrar gastos operativos de "Insumos" (201)', async ({ request }) => {
    const res = await request.post('/api/gastos', {
      headers: ctx.empleadoHeaders,
      data: {
        monto: 250,
        categoria: 'Insumos',
        descripcion: 'Compra de suavizante y bolsas'
      }
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(parseFloat(body.data.monto)).toBe(250);

    // Verificar impacto en caja en vivo
    const cajaRes = await request.get('/api/cajas/actual', {
      headers: ctx.empleadoHeaders
    });
    const cajaData = (await cajaRes.json()).data;
    expect(cajaData.totalEgresosEnVivo).toBe(250);
    expect(cajaData.efectivoEsperadoEnVivo).toBe(1250); // 1500 - 250
  });

  test('GET /api/gastos - Debe listar los gastos registrados (200)', async ({ request }) => {
    const res = await request.get('/api/gastos', {
      headers: ctx.headers
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    const list = body.data?.items;
    expect(Array.isArray(list), `Se esperaba body.data.items como array. Recibido: ${JSON.stringify(body.data)}`).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });
});
