import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';
import { uniqueId } from '../fixtures/test-data';

test.describe('Módulo 04: API de Catálogo, Categorías & Servicios', () => {
  let ctx: TenantWithEmpleadoContext;
  let categoriaId: number;
  let productoId: number;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);
  });

  test('POST /api/categorias - Empleado NO DEBE poder crear categoría (403)', async ({ request }) => {
    const res = await request.post('/api/categorias', {
      headers: ctx.empleadoHeaders,
      data: {
        nombre: 'Tintorería Hack'
      }
    });

    expect(res.status()).toBe(403);
  });

  test('POST /api/categorias - Admin DEBE poder crear una nueva categoría (201)', async ({ request }) => {
    const res = await request.post('/api/categorias', {
      headers: ctx.headers,
      data: {
        nombre: `Lavado Seco_${uniqueId()}`,
        descripcion: 'Prendas delicadas y trajes'
      }
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toHaveProperty('id');
    categoriaId = body.data.id;
  });

  test('GET /api/categorias - Debe listar categorías (200)', async ({ request }) => {
    const res = await request.get('/api/categorias', {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data?.categorias || body.data)).toBe(true);
  });

  test('POST /api/productos - Empleado NO DEBE poder crear un producto/servicio (403)', async ({ request }) => {
    const res = await request.post('/api/productos', {
      headers: ctx.empleadoHeaders,
      data: {
        nombre: 'Camisa',
        precioActual: 1500,
        categoriaId
      }
    });

    expect(res.status()).toBe(403);
  });

  test('POST /api/productos - Admin DEBE poder crear un producto/servicio (201)', async ({ request }) => {
    const res = await request.post('/api/productos', {
      headers: ctx.headers,
      data: {
        nombre: `Traje Completo_${uniqueId()}`,
        precioActual: 3500,
        costoEstimado: 1200,
        categoriaId,
        tiempoEstimadoMinutos: 120,
        disponible: true
      }
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toHaveProperty('id');
    productoId = body.data.id;
  });

  test('GET /api/productos - Admin DEBE ver el campo costoEstimado (200)', async ({ request }) => {
    const res = await request.get('/api/productos', {
      headers: ctx.headers
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    const list = body.data?.productos || body.data;
    const prod = list.find((p: any) => p.id === productoId);
    expect(prod).toBeDefined();
    expect(prod).toHaveProperty('costoEstimado');
  });

  test('GET /api/productos - Empleado NO DEBE ver el campo costoEstimado (200)', async ({ request }) => {
    const res = await request.get('/api/productos', {
      headers: ctx.empleadoHeaders
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    const list = body.data?.productos || body.data;
    const prod = list.find((p: any) => p.id === productoId);
    expect(prod).toBeDefined();
    expect(prod.costoEstimado).toBeUndefined();
  });

  test('PATCH /api/productos/:id/disponibilidad - Empleado SI DEBE poder cambiar disponibilidad (200)', async ({ request }) => {
    const res = await request.patch(`/api/productos/${productoId}/disponibilidad`, {
      headers: ctx.empleadoHeaders,
      data: {
        disponible: false
      }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('PUT /api/productos/:id - Empleado NO DEBE poder editar el precio (403)', async ({ request }) => {
    const res = await request.put(`/api/productos/${productoId}`, {
      headers: ctx.empleadoHeaders,
      data: {
        precioActual: 5000
      }
    });

    expect(res.status()).toBe(403);
  });

  test('DELETE /api/categorias/:id - No debe permitir eliminar categoría con productos activos (400)', async ({ request }) => {
    const res = await request.delete(`/api/categorias/${categoriaId}`, {
      headers: ctx.headers
    });

    expect(res.status()).toBe(400);
  });

  test('DELETE /api/productos/:id - Admin puede eliminar un producto (200)', async ({ request }) => {
    const res = await request.delete(`/api/productos/${productoId}`, {
      headers: ctx.headers
    });

    expect(res.status()).toBe(200);
  });

  test('DELETE /api/categorias/:id - Admin puede eliminar categoría vacía (200)', async ({ request }) => {
    const res = await request.delete(`/api/categorias/${categoriaId}`, {
      headers: ctx.headers
    });

    expect(res.status()).toBe(200);
  });
});
