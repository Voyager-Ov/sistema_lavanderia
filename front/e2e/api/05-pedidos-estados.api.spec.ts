import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';
import { generateRandomPhone, uniqueId } from '../fixtures/test-data';

test.describe('Módulo 05: API de Pedidos & Flujo de Estados', () => {
  let ctx: TenantWithEmpleadoContext;
  let clienteId: number;
  let productoId: number;
  let pedidoId: number;
  let codigoSeguimiento: string;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);

    // Crear cliente
    const cliRes = await request.post('/api/clientes', {
      headers: ctx.empleadoHeaders,
      data: {
        nombre: `Cliente Pedidos_${uniqueId()}`,
        telefono: generateRandomPhone()
      }
    });
    clienteId = (await cliRes.json()).data.id;

    // Admin crea categoría y producto
    const catRes = await request.post('/api/categorias', {
      headers: ctx.headers,
      data: { nombre: `Cat_Pedidos_${uniqueId()}` }
    });
    const catId = (await catRes.json()).data.id;

    const prodRes = await request.post('/api/productos', {
      headers: ctx.headers,
      data: {
        nombre: `Edredon Plumas_${uniqueId()}`,
        precioActual: 2500,
        categoriaId: catId,
        disponible: true
      }
    });
    productoId = (await prodRes.json()).data.id;
  });

  test('POST /api/pedidos - Debe rechazar creación con items vacíos (400)', async ({ request }) => {
    const res = await request.post('/api/pedidos', {
      headers: ctx.empleadoHeaders,
      data: {
        clienteId,
        items: []
      }
    });

    expect(res.status()).toBe(400);
  });

  test('POST /api/pedidos - Empleado DEBE poder crear un pedido y calcular el total (201)', async ({ request }) => {
    const res = await request.post('/api/pedidos', {
      headers: ctx.empleadoHeaders,
      data: {
        clienteId,
        items: [
          {
            productoId,
            cantidad: 2,
            precioUnitario: 2500,
            notas: 'Mancha leve en esquina'
          }
        ],
        notas: 'Entrega urgente'
      }
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(parseFloat(body.data.total)).toBe(5000);
    expect(body.data.estado).toBe('PENDIENTE');
    expect(body.data).toHaveProperty('codigoSeguimiento');

    pedidoId = body.data.id;
    codigoSeguimiento = body.data.codigoSeguimiento;
  });

  test('GET /api/pedidos/:id - Debe devolver detalle con historial e items (200)', async ({ request }) => {
    const res = await request.get(`/api/pedidos/${pedidoId}`, {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.id).toBe(pedidoId);
    expect(body.data.items.length).toBe(1);
    expect(body.data.historial.length).toBeGreaterThanOrEqual(1);
  });

  test('PATCH /api/pedidos/:id/estado - Transición a EN_PROCESO (200)', async ({ request }) => {
    const res = await request.patch(`/api/pedidos/${pedidoId}/estado`, {
      headers: ctx.empleadoHeaders,
      data: {
        estado: 'EN_PROCESO'
      }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.estado).toBe('EN_PROCESO');
  });

  test('PATCH /api/pedidos/:id/estado - Transición a LISTO_PARA_RETIRAR (200)', async ({ request }) => {
    const res = await request.patch(`/api/pedidos/${pedidoId}/estado`, {
      headers: ctx.empleadoHeaders,
      data: {
        estado: 'LISTO_PARA_RETIRAR'
      }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.estado).toBe('LISTO_PARA_RETIRAR');
  });

  test('PATCH /api/pedidos/:id/estado - Transición a ENTREGADO (200)', async ({ request }) => {
    const res = await request.patch(`/api/pedidos/${pedidoId}/estado`, {
      headers: ctx.empleadoHeaders,
      data: {
        estado: 'ENTREGADO'
      }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.estado).toBe('ENTREGADO');
  });

  test('PATCH /api/pedidos/:id/estado - Empleado NO DEBE poder cancelar un pedido ENTREGADO (403)', async ({ request }) => {
    const res = await request.patch(`/api/pedidos/${pedidoId}/estado`, {
      headers: ctx.empleadoHeaders,
      data: {
        estado: 'CANCELADO',
        motivoCancelacion: 'Error de cliente'
      }
    });

    expect(res.status()).toBe(403);
  });

  test('PATCH /api/pedidos/:id/estado - Admin DEBE poder cancelar pedido ENTREGADO con motivo (200)', async ({ request }) => {
    const res = await request.patch(`/api/pedidos/${pedidoId}/estado`, {
      headers: ctx.headers,
      data: {
        estado: 'CANCELADO',
        motivoCancelacion: 'Devolución autorizada por gerencia',
        descripcionCancelacion: 'Prenda no correspondía'
      }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.estado).toBe('CANCELADO');
  });

  test('GET /api/pedidos/motivos-cancelacion - Debe listar motivos de cancelación (200)', async ({ request }) => {
    const res = await request.get('/api/pedidos/motivos-cancelacion', {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
