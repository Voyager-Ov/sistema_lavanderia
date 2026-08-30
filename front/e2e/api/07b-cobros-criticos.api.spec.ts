import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';
import { generateRandomPhone, uniqueId } from '../fixtures/test-data';

/**
 * Módulo 07B: Casos críticos de cobro
 *
 * Cubre los flujos prohibidos por el protocolo "Jugar":
 *  - Cobro sin caja abierta → 400 NO_OPEN_CASH_REGISTER
 *  - Cobro de pedido ya cobrado → 400 BAD_REQUEST
 *  - Cobro con saldo a favor aplicado → saldo se consume atómicamente
 *  - Vuelto genera saldo a favor → cuenta corriente se acredita
 */
test.describe('Módulo 07B: Cobros Críticos (Caja, Doble Cobro, Saldo a Favor)', () => {
  let ctx: TenantWithEmpleadoContext;
  let clienteId: number;
  let productoId: number;
  let metodoEfectivoId: number;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);

    // Obtener método EFECTIVO (comparación exacta, sin fallback)
    const metodosRes = await request.get('/api/pagos/metodos', {
      headers: ctx.empleadoHeaders
    });
    const metodos = (await metodosRes.json()).data;
    const efec = metodos.find((m: any) => m.nombre.trim().toUpperCase() === 'EFECTIVO');
    if (!efec) {
      throw new Error(
        `[07B] No se encontró el método "EFECTIVO". Disponibles: ${metodos.map((m: any) => m.nombre).join(', ')}`
      );
    }
    metodoEfectivoId = efec.id;

    // Crear cliente
    const cliRes = await request.post('/api/clientes', {
      headers: ctx.empleadoHeaders,
      data: { nombre: `Cliente Cobro_${uniqueId()}`, telefono: generateRandomPhone() }
    });
    expect(cliRes.status()).toBe(201);
    clienteId = (await cliRes.json()).data.id;

    // Crear categoría + producto
    const catRes = await request.post('/api/categorias', {
      headers: ctx.headers,
      data: { nombre: `Cat_Cobro_${uniqueId()}` }
    });
    expect(catRes.status()).toBe(201);
    const catId = (await catRes.json()).data.id;

    const prodRes = await request.post('/api/productos', {
      headers: ctx.headers,
      data: {
        nombre: `Ropa Delicada_${uniqueId()}`,
        precioActual: 2000,
        categoriaId: catId
      }
    });
    expect(prodRes.status()).toBe(201);
    productoId = (await prodRes.json()).data.id;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-01: Cobro SIN caja abierta → debe rechazarse
  // ─────────────────────────────────────────────────────────────────────────────
  test('POST /api/pagos - Debe rechazar cobro si no hay caja abierta (400 NO_OPEN_CASH_REGISTER)', async ({ request }) => {
    // Crear pedido sin abrir caja (caja sigue cerrada en este tenant al inicio del test)
    const pedRes = await request.post('/api/pedidos', {
      headers: ctx.empleadoHeaders,
      data: {
        clienteId,
        items: [{ productoId, cantidad: 1, precioUnitario: 2000 }]
      }
    });
    expect(pedRes.status()).toBe(201);
    const pedidoId = (await pedRes.json()).data.id;

    // Intentar cobrar sin caja abierta
    const pagoRes = await request.post('/api/pagos', {
      headers: ctx.empleadoHeaders,
      data: {
        pedidoId,
        monto: 2000,
        metodoPagoId: metodoEfectivoId
      }
    });

    expect(pagoRes.status()).toBe(400);
    const body = await pagoRes.json();
    expect(body.ok).toBe(false);
    expect(body.code).toBe('NO_OPEN_CASH_REGISTER');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-02: Cobro de pedido ya cobrado → debe rechazarse
  // ─────────────────────────────────────────────────────────────────────────────
  test('POST /api/pagos - Debe rechazar cobro de pedido ya cobrado (400)', async ({ request }) => {
    // Abrir caja
    const cajaRes = await request.post('/api/cajas/abrir', {
      headers: ctx.empleadoHeaders,
      data: { montoInicial: 500 }
    });
    expect(cajaRes.status()).toBe(201);

    // Crear pedido
    const pedRes = await request.post('/api/pedidos', {
      headers: ctx.empleadoHeaders,
      data: {
        clienteId,
        items: [{ productoId, cantidad: 1, precioUnitario: 2000 }]
      }
    });
    expect(pedRes.status()).toBe(201);
    const pedidoId = (await pedRes.json()).data.id;

    // Cobrar la primera vez → debe funcionar
    const pago1Res = await request.post('/api/pagos', {
      headers: ctx.empleadoHeaders,
      data: { pedidoId, monto: 2000, metodoPagoId: metodoEfectivoId }
    });
    expect(pago1Res.status()).toBe(201);

    // Cobrar la segunda vez → debe rechazarse
    const pago2Res = await request.post('/api/pagos', {
      headers: ctx.empleadoHeaders,
      data: { pedidoId, monto: 2000, metodoPagoId: metodoEfectivoId }
    });

    expect(pago2Res.status()).toBe(400);
    const body = await pago2Res.json();
    expect(body.ok).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-03: Vuelto en efectivo genera saldo a favor en cuenta corriente
  // ─────────────────────────────────────────────────────────────────────────────
  test('POST /api/pagos - Vuelto con dejarVueltoAFavor=true debe acreditar cuenta corriente (201)', async ({ request }) => {
    // Caja ya abierta del test anterior (mismo tenant/empleado)
    // Crear pedido por $2000
    const pedRes = await request.post('/api/pedidos', {
      headers: ctx.empleadoHeaders,
      data: {
        clienteId,
        items: [{ productoId, cantidad: 1, precioUnitario: 2000 }]
      }
    });
    expect(pedRes.status()).toBe(201);
    const pedidoId = (await pedRes.json()).data.id;

    // Pagar $3000 (vuelto de $1000 queda a favor)
    const pagoRes = await request.post('/api/pagos', {
      headers: ctx.empleadoHeaders,
      data: {
        pedidoId,
        monto: 2000,
        metodoPagoId: metodoEfectivoId,
        montoRecibidoEfectivo: 3000,
        dejarVueltoAFavor: true
      }
    });
    expect(pagoRes.status()).toBe(201);
    const pagoBody = await pagoRes.json();
    expect(pagoBody.ok).toBe(true);

    // Verificar que la cuenta corriente del cliente tiene $1000 de saldo a favor
    const cuentaRes = await request.get(`/api/clientes/${clienteId}/cuenta-corriente/estado-cuenta`, {
      headers: ctx.empleadoHeaders
    });
    expect(cuentaRes.status()).toBe(200);
    const cuentaData = (await cuentaRes.json()).data;
    expect(cuentaData.resumen).toHaveProperty('saldoNeto');
    expect(parseFloat(cuentaData.resumen.saldoNeto)).toBe(1000);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // TC-04: Aplicar saldo a favor en el siguiente cobro
  // ─────────────────────────────────────────────────────────────────────────────
  test('POST /api/pagos - Aplicar saldo a favor debe consumirlo atómicamente (201)', async ({ request }) => {
    // El cliente tiene $1000 de saldo a favor del test anterior
    // Crear pedido nuevo por $2000
    const pedRes = await request.post('/api/pedidos', {
      headers: ctx.empleadoHeaders,
      data: {
        clienteId,
        items: [{ productoId, cantidad: 1, precioUnitario: 2000 }]
      }
    });
    expect(pedRes.status()).toBe(201);
    const pedidoId = (await pedRes.json()).data.id;

    // Pagar $1000 en efectivo + $1000 de saldo a favor
    const pagoRes = await request.post('/api/pagos', {
      headers: ctx.empleadoHeaders,
      data: {
        pedidoId,
        monto: 2000,
        metodoPagoId: metodoEfectivoId,
        montoRecibidoEfectivo: 1000,
        aplicarSaldoAFavor: true
      }
    });
    expect(pagoRes.status()).toBe(201);
    const pagoBody = await pagoRes.json();
    expect(pagoBody.ok).toBe(true);

    // Verificar que el saldo a favor quedó en $0 (consumido completamente)
    const cuentaRes = await request.get(`/api/clientes/${clienteId}/cuenta-corriente/estado-cuenta`, {
      headers: ctx.empleadoHeaders
    });
    expect(cuentaRes.status()).toBe(200);
    const cuentaData = (await cuentaRes.json()).data;
    expect(parseFloat(cuentaData.resumen.saldoNeto)).toBe(0);
  });
});
