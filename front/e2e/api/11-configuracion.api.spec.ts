import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';

test.describe('Módulo 11: API de Configuración', () => {
  let ctx: TenantWithEmpleadoContext;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);
  });

  test('GET /api/configuracion - Admin DEBE poder consultar la configuración (200)', async ({ request }) => {
    const res = await request.get('/api/configuracion', {
      headers: ctx.headers
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toBeDefined();
  });

  test('GET /api/configuracion - Empleado NO DEBE tener acceso a configuración (403)', async ({ request }) => {
    const res = await request.get('/api/configuracion', {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(403);
  });

  test('PATCH /api/configuracion - Admin DEBE poder actualizar parámetros del negocio (200)', async ({ request }) => {
    const res = await request.patch('/api/configuracion', {
      headers: ctx.headers,
      data: {
        telefono: '1144556677',
        direccion: 'Calle Central 789',
        pieTicket: '¡Gracias por confiar en nuestra lavandería!'
      }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
