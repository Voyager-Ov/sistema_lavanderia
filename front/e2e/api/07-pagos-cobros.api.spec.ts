import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';
import { generateRandomPhone, uniqueId } from '../fixtures/test-data';

test.describe('Módulo 07: API de Pagos, Métodos & Anulaciones', () => {
  let ctx: TenantWithEmpleadoContext;
  let clienteId: number;
  let productoId: number;
  let pedidoId: number;
  let pagoId: number;
  let metodoEfectivoId: number;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);

    // Métodos de pago
    const metodosRes = await request.get('/api/pagos/metodos', {
      headers: ctx.empleadoHeaders
    });
    const metodos = (await metodosRes.json()).data;
    const efec = metodos.find((m: any) => m.nombre.trim().toUpperCase() === 'EFECTIVO');
    if (!efec) {
      throw new Error(
        `[07-pagos-cobros] No se encontró el método de pago "EFECTIVO" en la BD. ` +
        `Métodos disponibles: ${metodos.map((m: any) => m.nombre).join(', ')}`
      );
    }
    metodoEfectivoId = efec.id;

    // Cliente
    const cliRes = await request.post('/api/clientes', {
      headers: ctx.empleadoHeaders,
      data: {
        nombre: `Cliente Pagos_${uniqueId()}`,
        telefono: generateRandomPhone()
      }
    });
    clienteId = (await cliRes.json()).data.id;

    // Producto
    const catRes = await request.post('/api/categorias', {
      headers: ctx.headers,
      data: { nombre: `Cat_Pagos_${uniqueId()}` }
    });
    const catId = (await catRes.json()).data.id;

    const prodRes = await request.post('/api/productos', {
      headers: ctx.headers,
      data: {
        nombre: `Limpieza Cortina_${uniqueId()}`,
        precioActual: 3000,
        categoriaId: catId
      }
    });
    productoId = (await prodRes.json()).data.id;

    // Abrir Caja
    await request.post('/api/cajas/abrir', {
      headers: ctx.empleadoHeaders,
      data: { montoInicial: 1000 }
    });

    // Crear Pedido por $6000
    const pedRes = await request.post('/api/pedidos', {
      headers: ctx.empleadoHeaders,
      data: {
        clienteId,
        items: [{ productoId, cantidad: 2, precioUnitario: 3000 }]
      }
    });
    pedidoId = (await pedRes.json()).data.id;
  });

  test('GET /api/pagos/metodos - Debe listar los métodos de pago disponibles (200)', async ({ request }) => {
    const res = await request.get('/api/pagos/metodos', {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('POST /api/pagos - Debe registrar cobro parcial de pedido (201)', async ({ request }) => {
    const res = await request.post('/api/pagos', {
      headers: ctx.empleadoHeaders,
      data: {
        pedidoId,
        monto: 3000,
        metodoPagoId: metodoEfectivoId,
        referencia: 'Anticipo efectivo'
      }
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    pagoId = body.data.id;

    // Verificar saldo restante del pedido
    const pedRes = await request.get(`/api/pedidos/${pedidoId}`, {
      headers: ctx.empleadoHeaders
    });
    const pedData = (await pedRes.json()).data;
    expect(parseFloat(pedData.totalPagado)).toBe(3000);
    expect(parseFloat(pedData.saldoPendiente)).toBe(3000);

    // Verificar caja en vivo
    const cajaRes = await request.get('/api/cajas/actual', {
      headers: ctx.empleadoHeaders
    });
    const cajaData = (await cajaRes.json()).data;
    expect(cajaData.totalIngresosEnVivo).toBe(3000);
    expect(cajaData.efectivoEsperadoEnVivo).toBe(4000); // 1000 inicial + 3000 ingreso
  });

  test('PATCH /api/pagos/:id/anular - Debe anular el cobro y actualizar el saldo en vivo (200)', async ({ request }) => {
    const res = await request.patch(`/api/pagos/${pagoId}/anular`, {
      headers: ctx.empleadoHeaders,
      data: {
        motivo: 'Error en monto de cobro'
      }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    // Verificar que la caja en vivo reste el ingreso
    const cajaRes = await request.get('/api/cajas/actual', {
      headers: ctx.empleadoHeaders
    });
    const cajaData = (await cajaRes.json()).data;
    expect(cajaData.totalIngresosEnVivo).toBe(0);
    expect(cajaData.efectivoEsperadoEnVivo).toBe(1000);
  });

  test('PATCH /api/pagos/:id/anular - No debe permitir anular un cobro ya anulado (400)', async ({ request }) => {
    const res = await request.patch(`/api/pagos/${pagoId}/anular`, {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(400);
  });
});
