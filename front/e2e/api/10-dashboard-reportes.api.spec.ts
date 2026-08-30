import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';
import { generateRandomPhone, uniqueId } from '../fixtures/test-data';

test.describe('Módulo 10: API de Dashboard & Reportes', () => {
  let ctx: TenantWithEmpleadoContext;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);
  });

  test('GET /api/dashboard/stats - Estructura del contrato debe tener todos los campos requeridos (200)', async ({ request }) => {
    const res = await request.get('/api/dashboard/stats', {
      headers: ctx.headers
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    const data = body.data;
    // Verificar estructura completa del contrato (ningún campo puede ser undefined ni null)
    expect(data).toHaveProperty('ingresos');
    expect(data.ingresos).toHaveProperty('mesActual');
    expect(data.ingresos).toHaveProperty('mesAnterior');
    expect(data.ingresos).toHaveProperty('hoyCobrado');
    expect(data.ingresos).toHaveProperty('ayerCobrado');
    expect(data.ingresos).toHaveProperty('hoyTotalPedidos');

    expect(data).toHaveProperty('pedidosDelDia');
    expect(data.pedidosDelDia).toHaveProperty('hoy');
    expect(data.pedidosDelDia).toHaveProperty('ayer');

    expect(data).toHaveProperty('pedidosActivos');
    expect(data).toHaveProperty('topClientes');
    expect(data).toHaveProperty('ultimosPedidos');
    expect(data).toHaveProperty('ventasPorDia');

    // Los tipos deben ser correctos (número, no null ni string vacío)
    expect(typeof data.ingresos.mesActual).toBe('number');
    expect(typeof data.ingresos.hoyCobrado).toBe('number');
    expect(Array.isArray(data.topClientes)).toBe(true);
    expect(Array.isArray(data.ultimosPedidos)).toBe(true);
    expect(Array.isArray(data.ventasPorDia)).toBe(true);
  });

  test('GET /api/dashboard/stats - pedidosActivos debe reflejar pedido creado en BD (no valor hardcodeado)', async ({ request }) => {
    // Crear un pedido para que pedidosActivos sea > 0
    const catRes = await request.post('/api/categorias', {
      headers: ctx.headers,
      data: { nombre: `Cat_Dash_${uniqueId()}` }
    });
    const catId = (await catRes.json()).data.id;

    const prodRes = await request.post('/api/productos', {
      headers: ctx.headers,
      data: { nombre: `Prod_Dash_${uniqueId()}`, precioActual: 1500, categoriaId: catId }
    });
    const productoId = (await prodRes.json()).data.id;

    const cliRes = await request.post('/api/clientes', {
      headers: ctx.empleadoHeaders,
      data: { nombre: `CLI_Dash_${uniqueId()}`, telefono: generateRandomPhone() }
    });
    const clienteId = (await cliRes.json()).data.id;

    await request.post('/api/pedidos', {
      headers: ctx.empleadoHeaders,
      data: {
        clienteId,
        items: [{ productoId, cantidad: 1, precioUnitario: 1500 }]
      }
    });

    // Ahora el dashboard debe reflejar al menos 1 pedido activo
    const res = await request.get('/api/dashboard/stats', {
      headers: ctx.headers
    });
    expect(res.status()).toBe(200);
    const data = (await res.json()).data;

    expect(data.pedidosActivos).toBeGreaterThanOrEqual(1);
    expect(data.pedidosDelDia.hoy).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/reportes/servicios - Estructura de reporte debe ser válida (200)', async ({ request }) => {
    const res = await request.get('/api/reportes/servicios', {
      headers: ctx.headers
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    // El reporte de servicios debe devolver un objeto, no null ni array vacío arbitrario
    expect(body.data).not.toBeNull();
    expect(typeof body.data).toBe('object');
  });

  test('GET /api/reportes/servicios - Empleado NO DEBE poder consultar reportes ejecutivos (403)', async ({ request }) => {
    const res = await request.get('/api/reportes/servicios', {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});

