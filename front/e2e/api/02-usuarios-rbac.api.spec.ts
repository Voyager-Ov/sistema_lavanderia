import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';
import { generateRandomEmail, generateRandomPhone, TEST_PASSWORDS, uniqueId } from '../fixtures/test-data';

test.describe('Módulo 02: API de Usuarios & Control de Acceso (RBAC)', () => {
  let ctx: TenantWithEmpleadoContext;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);
  });

  test('POST /api/usuarios - Admin DEBE poder crear un nuevo empleado (201)', async ({ request }) => {
    const nuevoEmail = generateRandomEmail('emp_nuevo');
    const res = await request.post('/api/usuarios', {
      headers: ctx.headers,
      data: {
        nombre: `Emp_${uniqueId()}`,
        email: nuevoEmail,
        password: TEST_PASSWORDS.EMPLEADO,
        rol: 'EMPLEADO',
        telefono: generateRandomPhone()
      }
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.email).toBe(nuevoEmail.toLowerCase());
  });

  test('POST /api/usuarios - Empleado NO DEBE poder crear otro usuario (403)', async ({ request }) => {
    const res = await request.post('/api/usuarios', {
      headers: ctx.empleadoHeaders,
      data: {
        nombre: 'Hacker',
        email: generateRandomEmail('hacker'),
        password: TEST_PASSWORDS.VALID,
        rol: 'ADMIN'
      }
    });

    expect(res.status()).toBe(403);
  });

  test('GET /api/usuarios - Admin DEBE poder listar los usuarios del negocio (200)', async ({ request }) => {
    const res = await request.get('/api/usuarios', {
      headers: ctx.headers
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    const list = body.data?.items;
    expect(Array.isArray(list), `Se esperaba body.data.items como array. Recibido: ${JSON.stringify(body.data)}`).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  test('GET /api/usuarios - Empleado solo puede ver sus propios datos en el listado (200)', async ({ request }) => {
    const res = await request.get('/api/usuarios', {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    const list = body.data?.items;
    expect(Array.isArray(list), `Se esperaba body.data.items como array. Recibido: ${JSON.stringify(body.data)}`).toBe(true);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(ctx.empleado.id);
  });

  test('GET /api/usuarios/:id - Empleado NO DEBE poder consultar perfil de otro empleado (403)', async ({ request }) => {
    const res = await request.get(`/api/usuarios/${ctx.admin.id}`, {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(403);
  });

  test('GET /api/usuarios/:id - Empleado SI DEBE poder consultar su propio perfil (200)', async ({ request }) => {
    const res = await request.get(`/api/usuarios/${ctx.empleado.id}`, {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.id).toBe(ctx.empleado.id);
  });

  test('PUT /api/usuarios/:id - Admin DEBE poder actualizar datos de un usuario (200)', async ({ request }) => {
    const nuevoNombre = `EmpModificado_${uniqueId()}`;
    const res = await request.put(`/api/usuarios/${ctx.empleado.id}`, {
      headers: ctx.headers,
      data: {
        nombre: nuevoNombre
      }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('PATCH /api/usuarios/:id/estado - Admin DEBE poder dar de baja a un empleado (200)', async ({ request }) => {
    // Creamos un empleado temporal para dar de baja
    const tempEmail = generateRandomEmail('temp_emp');
    const createRes = await request.post('/api/usuarios', {
      headers: ctx.headers,
      data: {
        nombre: 'Temp Employee',
        email: tempEmail,
        password: TEST_PASSWORDS.EMPLEADO,
        rol: 'EMPLEADO'
      }
    });
    const tempUser = (await createRes.json()).data;

    const delRes = await request.patch(`/api/usuarios/${tempUser.id}/estado`, {
      headers: ctx.headers
    });

    expect(delRes.status()).toBe(200);
  });
});
