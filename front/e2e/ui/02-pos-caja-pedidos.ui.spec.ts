import { test, expect } from '@playwright/test';
import { createTenantWithEmpleado, injectAuthState, TenantWithEmpleadoContext } from '../fixtures/auth.fixture';
import { generateRandomPhone, uniqueId } from '../fixtures/test-data';

test.describe('Módulo UI 02: POS, Terminal & Caja', () => {
  let ctx: TenantWithEmpleadoContext;
  let productoId: number;
  let clienteNombre: string;
  let clienteTelefono: string;

  test.beforeAll(async ({ request }) => {
    ctx = await createTenantWithEmpleado(request);

    // Crear categoría y producto base
    const catRes = await request.post('/api/categorias', {
      headers: ctx.headers,
      data: { nombre: `Cat_UI_${uniqueId()}` }
    });
    expect(catRes.status()).toBe(201);
    const catId = (await catRes.json()).data.id;

    const prodRes = await request.post('/api/productos', {
      headers: ctx.headers,
      data: {
        nombre: `Acolchado 2 Plazas_${uniqueId()}`,
        precioActual: 3500,
        categoriaId: catId,
        disponible: true
      }
    });
    expect(prodRes.status()).toBe(201);
    productoId = (await prodRes.json()).data.id;

    // Crear un cliente con nombre único para verificar en la UI
    clienteNombre = `Juan Pérez_${uniqueId()}`;
    clienteTelefono = generateRandomPhone();
    const cliRes = await request.post('/api/clientes', {
      headers: ctx.empleadoHeaders,
      data: { nombre: clienteNombre, telefono: clienteTelefono }
    });
    expect(cliRes.status()).toBe(201);
  });

  test('Debe cargar /pos/caja y mostrar "Caja y Finanzas" cuando no hay caja abierta', async ({ page }) => {
    await injectAuthState(page, ctx.empleado, ctx.empleadoToken);
    await page.goto('/pos/caja');

    // El h1 exacto definido en la página
    await expect(page.getByRole('heading', { name: /Caja y Finanzas/i, level: 1 })).toBeVisible();

    // Sin caja abierta: debe mostrar el formulario de apertura
    const abrirBtn = page.getByRole('button', { name: /abrir caja|abrir turno/i });
    await expect(abrirBtn).toBeVisible();
  });

  test('Debe mostrar estado "ABIERTA" en /pos/caja después de abrir caja via API', async ({ page, request }) => {
    // Abrir caja via API para que la UI refleje el estado real
    const cajaRes = await request.post('/api/cajas/abrir', {
      headers: ctx.empleadoHeaders,
      data: { montoInicial: 1500 }
    });
    expect(cajaRes.status()).toBe(201);
    const cajaData = (await cajaRes.json()).data;
    expect(cajaData.estado).toBe('ABIERTA');

    await injectAuthState(page, ctx.empleado, ctx.empleadoToken);
    await page.goto('/pos/caja');

    // Con caja abierta: debe mostrar el dashboard de caja, no el formulario de apertura
    await expect(page.getByRole('heading', { name: /Caja y Finanzas/i, level: 1 })).toBeVisible();
    // El formulario de apertura NO debe estar visible
    await expect(page.getByRole('button', { name: /abrir caja|abrir turno/i })).not.toBeVisible({ timeout: 5000 });
    // El botón de cierre de caja debe aparecer
    await expect(page.getByRole('button', { name: /cerrar caja|cerrar turno/i })).toBeVisible();
  });

  test('Debe listar el pedido creado via API en la tabla de /pos/pedidos', async ({ page, request }) => {
    // Crear cliente para el pedido
    const cliRes = await request.post('/api/clientes', {
      headers: ctx.empleadoHeaders,
      data: { nombre: `Cliente Pedido UI_${uniqueId()}`, telefono: generateRandomPhone() }
    });
    const cliId = (await cliRes.json()).data.id;

    // Crear pedido via API
    const pedRes = await request.post('/api/pedidos', {
      headers: ctx.empleadoHeaders,
      data: {
        clienteId: cliId,
        items: [{ productoId, cantidad: 1, precioUnitario: 3500 }],
        notas: 'Test UI pedido visible'
      }
    });
    expect(pedRes.status()).toBe(201);
    const pedData = (await pedRes.json()).data;
    const codigoSeguimiento: string = pedData.codigoSeguimiento;
    expect(codigoSeguimiento).toBeTruthy();

    await injectAuthState(page, ctx.empleado, ctx.empleadoToken);
    await page.goto('/pos/pedidos');

    // La tabla debe mostrar el código de seguimiento del pedido creado
    await expect(page.locator(`text=${codigoSeguimiento}`)).toBeVisible({ timeout: 10000 });

    // Debe mostrar el estado PENDIENTE
    await expect(page.locator('text=PENDIENTE').first()).toBeVisible();
  });

  test('Debe mostrar el cliente creado via API en el directorio /pos/clientes', async ({ page }) => {
    await injectAuthState(page, ctx.empleado, ctx.empleadoToken);
    await page.goto('/pos/clientes');

    // El título exacto de la página
    await expect(page.getByRole('heading', { name: /Directorio de Clientes/i, level: 1 })).toBeVisible();

    // Verificar que el cliente creado en beforeAll aparece en la tabla
    await expect(page.locator(`text=${clienteNombre}`)).toBeVisible({ timeout: 10000 });

    // Verificar que el botón "Nuevo Cliente" existe y apunta a la acción correcta
    await expect(page.getByRole('button', { name: /Nuevo Cliente/i })).toBeVisible();
  });
});

