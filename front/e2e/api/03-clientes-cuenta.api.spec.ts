import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';
import { generateRandomPhone, uniqueId } from '../fixtures/test-data';

test.describe('Módulo 03: API de Clientes & Cuenta Corriente', () => {
  let ctx: TenantWithEmpleadoContext;
  let clienteId: number;
  const clienteTelefono = generateRandomPhone();

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);
  });

  test('POST /api/clientes - Empleado DEBE poder crear un cliente nuevo (201)', async ({ request }) => {
    const res = await request.post('/api/clientes', {
      headers: ctx.empleadoHeaders,
      data: {
        nombre: `Cliente_${uniqueId()}`,
        telefono: clienteTelefono,
        direccion: 'Av. Libertador 1234',
        email: 'cliente@test.com'
      }
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toHaveProperty('id');
    clienteId = body.data.id;
  });

  test('POST /api/clientes - No debe permitir crear cliente sin teléfono (400)', async ({ request }) => {
    const res = await request.post('/api/clientes', {
      headers: ctx.empleadoHeaders,
      data: {
        nombre: 'Sin Telefono'
      }
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test('POST /api/clientes - No debe permitir teléfono duplicado en el mismo negocio (400)', async ({ request }) => {
    const res = await request.post('/api/clientes', {
      headers: ctx.empleadoHeaders,
      data: {
        nombre: 'Cliente Duplicado',
        telefono: clienteTelefono
      }
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test('GET /api/clientes - Debe buscar y listar clientes (200)', async ({ request }) => {
    const res = await request.get(`/api/clientes?search=${clienteTelefono}`, {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    const list = body.data?.items;
    expect(Array.isArray(list), `Se esperaba body.data.items como array. Recibido: ${JSON.stringify(body.data)}`).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  test('GET /api/clientes/:id - Debe obtener el detalle del cliente (200)', async ({ request }) => {
    const res = await request.get(`/api/clientes/${clienteId}`, {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.id).toBe(clienteId);
  });

  test('GET /api/clientes/:id - Retorna 404 para cliente inexistente', async ({ request }) => {
    const res = await request.get('/api/clientes/999999', {
      headers: ctx.empleadoHeaders
    });
    expect(res.status()).toBe(404);
  });

  test('PUT /api/clientes/:id - Debe actualizar datos del cliente (200)', async ({ request }) => {
    const nuevoNombre = `ClienteModificado_${uniqueId()}`;
    const res = await request.put(`/api/clientes/${clienteId}`, {
      headers: ctx.empleadoHeaders,
      data: {
        nombre: nuevoNombre,
        direccion: 'Calle Nueva 456'
      }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('GET /api/clientes/:id/cuenta-corriente/estado-cuenta - Debe consultar saldo y movimientos (200)', async ({ request }) => {
    const res = await request.get(`/api/clientes/${clienteId}/cuenta-corriente/estado-cuenta`, {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    // La respuesta de estado-cuenta devuelve { cliente, resumen, pedidosDeuda, pedidosEnCurso, creditosDisponibles }
    expect(body.data).toHaveProperty('resumen');
    expect(body.data.resumen).toHaveProperty('saldoNeto');
  });

  test('POST /api/clientes/:id/cuenta-corriente/ajuste-credito - Admin puede emitir ajuste manual de saldo a favor (201)', async ({ request }) => {
    const res = await request.post(`/api/clientes/${clienteId}/cuenta-corriente/ajuste-credito`, {
      headers: ctx.headers,
      data: {
        monto: 500,
        motivo: 'Promoción fidelidad inicial'
      }
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('POST /api/clientes/:id/cuenta-corriente/ajuste-credito - Empleado NO DEBE poder emitir ajuste de saldo (403)', async ({ request }) => {
    const res = await request.post(`/api/clientes/${clienteId}/cuenta-corriente/ajuste-credito`, {
      headers: ctx.empleadoHeaders,
      data: {
        monto: 1000,
        motivo: 'Ajuste no autorizado'
      }
    });

    expect(res.status()).toBe(403);
  });

  test('PATCH /api/clientes/:id/estado - Debe rechazar baja sin motivoBaja (400)', async ({ request }) => {
    const res = await request.patch(`/api/clientes/${clienteId}/estado`, {
      headers: ctx.headers,
      data: {}
    });

    expect(res.status()).toBe(400);
  });

  test('PATCH /api/clientes/:id/estado - Admin puede dar de baja con motivo (200)', async ({ request }) => {
    const res = await request.patch(`/api/clientes/${clienteId}/estado`, {
      headers: ctx.headers,
      data: {
        motivoBaja: 'Cliente solicitó eliminación de datos'
      }
    });

    expect(res.status()).toBe(200);
  });
});
