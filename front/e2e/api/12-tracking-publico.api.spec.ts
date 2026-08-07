import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';
import { generateRandomPhone, uniqueId } from '../fixtures/test-data';

test.describe('Módulo 12: API de Tracking Público de Pedidos', () => {
  let ctx: TenantWithEmpleadoContext;
  let codigoSeguimiento: string;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);

    // Crear cliente y producto
    const cliRes = await request.post('/api/clientes', {
      headers: ctx.empleadoHeaders,
      data: {
        nombre: `Cliente Tracking_${uniqueId()}`,
        telefono: generateRandomPhone()
      }
    });
    const clienteId = (await cliRes.json()).data.id;

    const catRes = await request.post('/api/categorias', {
      headers: ctx.headers,
      data: { nombre: `Cat_Tracking_${uniqueId()}` }
    });
    const catId = (await catRes.json()).data.id;

    const prodRes = await request.post('/api/productos', {
      headers: ctx.headers,
      data: {
        nombre: `Campera_${uniqueId()}`,
        precioActual: 4000,
        categoriaId: catId
      }
    });
    const productoId = (await prodRes.json()).data.id;

    // Crear Pedido
    const pedRes = await request.post('/api/pedidos', {
      headers: ctx.empleadoHeaders,
      data: {
        clienteId,
        items: [{ productoId, cantidad: 1, precioUnitario: 4000 }]
      }
    });
    const pedData = (await pedRes.json()).data;
    codigoSeguimiento = pedData.codigoSeguimiento;
  });

  test('GET /api/tracking/:negocioId/:codigo - Consulta pública sin autenticación (200)', async ({ request }) => {
    const res = await request.get(`/api/tracking/${ctx.negocioId}/${codigoSeguimiento}`);

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toHaveProperty('estado');
    expect(body.data.codigoSeguimiento).toBe(codigoSeguimiento);
  });

  test('GET /api/tracking/:negocioId/:codigo - Retorna 404 para código inexistente', async ({ request }) => {
    const res = await request.get(`/api/tracking/${ctx.negocioId}/CODIGO_FALSO_999`);
    expect(res.status()).toBe(404);
  });
});
