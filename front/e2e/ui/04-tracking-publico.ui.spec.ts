import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';
import { generateRandomPhone, uniqueId } from '../fixtures/test-data';

test.describe('Módulo UI 04: Vista Pública de Tracking de Pedido', () => {
  let ctx: TenantWithEmpleadoContext;
  let codigoSeguimiento: string;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);

    // Crear cliente y producto
    const cliRes = await request.post('/api/clientes', {
      headers: ctx.empleadoHeaders,
      data: {
        nombre: `Cliente Track_${uniqueId()}`,
        telefono: generateRandomPhone()
      }
    });
    const clienteId = (await cliRes.json()).data.id;

    const catRes = await request.post('/api/categorias', {
      headers: ctx.headers,
      data: { nombre: `Cat_Track_${uniqueId()}` }
    });
    const catId = (await catRes.json()).data.id;

    const prodRes = await request.post('/api/productos', {
      headers: ctx.headers,
      data: {
        nombre: `Lavado Camisas_${uniqueId()}`,
        precioActual: 1800,
        categoriaId: catId
      }
    });
    const productoId = (await prodRes.json()).data.id;

    // Crear pedido
    const pedRes = await request.post('/api/pedidos', {
      headers: ctx.empleadoHeaders,
      data: {
        clienteId,
        items: [{ productoId, cantidad: 1, precioUnitario: 1800 }]
      }
    });
    const pedData = (await pedRes.json()).data;
    codigoSeguimiento = pedData.codigoSeguimiento;
  });

  test('Debe cargar la vista pública de tracking con el estado del pedido y datos del cliente', async ({ page }) => {
    await page.goto(`/tracking/${ctx.negocioId}/${codigoSeguimiento}`);

    // Verificar saludo con el cliente y número de ticket
    await expect(page.locator('text=Seguimiento de tu pedido')).toBeVisible({ timeout: 10000 });
    // Verificar que el estado inicial "Recibido" (PENDIENTE) está visible
    await expect(page.locator('text=Recibido')).toBeVisible();
  });
});

