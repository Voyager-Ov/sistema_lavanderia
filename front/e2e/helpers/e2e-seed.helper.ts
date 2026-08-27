import { expect, Page, request } from '@playwright/test';
import { SeedBusinessData, SeedCategory, SeedClient, SeedEmployee, SeedService } from '../fixtures/seed-data';

const BACKEND_URL = process.env.API_URL || 'http://localhost:5001';

export interface CreatedTenantSession {
  token: string;
  usuario: any;
  negocioId: number;
  email: string;
  password: string;
}

export class E2ESeedHelper {
  /**
   * Módulo 1: Registrar un nuevo negocio desde la UI / API, aprobar la solicitud y retornar la sesión.
   */
  static async registerAndApproveNewBusiness(
    page: Page,
    businessData: SeedBusinessData
  ): Promise<CreatedTenantSession> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });

    // 1. Navegar a /register en Chromium y completar el formulario visualmente
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#nombre', { state: 'attached', timeout: 30000 });

    await page.fill('#nombre', businessData.usuarioNombre);
    await page.fill('#email', businessData.email);
    await page.fill('#negocioNombre', businessData.negocioNombre);
    await page.fill('#password', businessData.password);

    await page.click('button[type="submit"]');

    // Esperar a que se redireccione a la vista de solicitud pendiente o confirmación
    await page.waitForURL(/.*solicitud-pendiente.*/, { timeout: 15000 }).catch(() => {});

    // 2. Obtener solicitud de la BD o aprobarla vía SuperAdmin
    const superAdminRes = await apiContext.post('/api/auth/login', {
      data: {
        email: 'octavio.velo2022@gmail.com',
        password: '123456789'
      }
    });

    const superAdminData = await superAdminRes.json();
    if (!superAdminRes.ok() || !superAdminData.data?.token) {
      throw new Error(`Error en login SuperAdmin: ${JSON.stringify(superAdminData)}`);
    }

    const superAdminToken = superAdminData.data.token;

    // Listar solicitudes pendientes para encontrar la de este email
    const solicitudesRes = await apiContext.get('/api/superadmin/solicitudes', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const solicitudesData = await solicitudesRes.json();
    const lista = solicitudesData.data?.solicitudes || solicitudesData.data || [];
    let miSolicitud = lista.find((s: any) => 
      (s.emailSolicitante && s.emailSolicitante.toLowerCase() === businessData.email.toLowerCase()) || 
      (s.email && s.email.toLowerCase() === businessData.email.toLowerCase())
    );

    if (!miSolicitud) {
      // Fallback a API de registro directo
      const regRes = await apiContext.post('/api/auth/register', {
        data: {
          usuarioNombre: businessData.usuarioNombre,
          email: businessData.email,
          password: businessData.password,
          negocioNombre: businessData.negocioNombre,
          telefono: businessData.telefono
        }
      });
      const regData = await regRes.json();
      const solId = regData.data?.solicitud?.id || regData.solicitud?.id;
      if (solId) {
        miSolicitud = { id: solId };
      }
    }

    if (miSolicitud && miSolicitud.id) {
      const approveRes = await apiContext.patch(`/api/superadmin/solicitudes/${miSolicitud.id}/aprobar`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      expect(approveRes.ok()).toBeTruthy();
    }

    // 3. Login con el Administrador recién creado
    const loginRes = await apiContext.post('/api/auth/login', {
      data: {
        email: businessData.email,
        password: businessData.password
      }
    });

    const loginData = await loginRes.json();
    expect(loginRes.ok()).toBeTruthy();

    const token = loginData.data.token;
    const usuario = loginData.data.usuario;
    const negocioId = usuario.negocioId || loginData.data.negocio?.id;

    // 4. Inyectar sesión en el navegador y navegar a /dashboard
    await page.addInitScript(({ t, u }) => {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: u,
            token: t,
            isAuthenticated: true
          },
          version: 0
        })
      );
    }, { t: token, u: usuario });

    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    return {
      token,
      usuario,
      negocioId,
      email: businessData.email,
      password: businessData.password
    };
  }

  static async injectSession(page: Page, session: { token: string; usuario: any }) {
    await page.addInitScript(({ t, u }) => {
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: u,
            token: t,
            isAuthenticated: true
          },
          version: 0
        })
      );
    }, { t: session.token, u: session.usuario });
  }

  /**
   * Módulo 2 & 3: Crear Categorías y Servicios en el backend/UI
   */
  static async seedCategoriesAndServicesViaApi(
    token: string,
    categories: SeedCategory[],
    services: SeedService[]
  ) {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const createdCategories: Record<string, number> = {};

    // 1. Crear Categorías
    for (const cat of categories) {
      const res = await apiContext.post('/api/categorias', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          nombre: cat.nombre,
          descripcion: cat.descripcion,
          icono: cat.icono || 'WashingMachine',
          color: cat.color || '#3B82F6'
        }
      });
      const data = await res.json();
      if (res.ok() && data.data) {
        createdCategories[cat.nombre] = data.data.id;
      } else {
        console.error(`⚠️ Error creando categoría '${cat.nombre}':`, data);
      }
    }

    // 2. Crear Servicios
    const createdServices: any[] = [];
    for (const srv of services) {
      const catId = createdCategories[srv.categoriaNombre];
      const res = await apiContext.post('/api/servicios', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          nombre: srv.nombre,
          precioActual: srv.precio,
          precio: srv.precio,
          categoriaId: catId || undefined,
          tiempoEstimadoMinutos: srv.tiempoEstimadoMinutos,
          unidadMedida: srv.unidadMedida,
          descripcion: srv.descripcion
        }
      });
      const data = await res.json();
      if (res.ok() && data.data) {
        createdServices.push(data.data);
      } else {
        console.error(`⚠️ Error creando servicio '${srv.nombre}':`, data);
      }
    }

    return { createdCategories, createdServices };
  }

  /**
   * Módulo 4 & 5: Crear Empleados y Clientes (15+ registros para probar paginado)
   */
  static async seedEmployeesAndClientsViaApi(
    token: string,
    employees: SeedEmployee[],
    clients: SeedClient[]
  ) {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const createdEmployees: any[] = [];
    const createdClients: any[] = [];

    for (const emp of employees) {
      const res = await apiContext.post('/api/usuarios', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          nombre: emp.nombre,
          email: emp.email,
          password: emp.password,
          rol: emp.rol,
          telefono: emp.telefono
        }
      });
      const data = await res.json();
      if (res.ok() && data.data) {
        createdEmployees.push(data.data);
      }
    }

    for (const cli of clients) {
      const res = await apiContext.post('/api/clientes', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          nombre: cli.nombre,
          apellido: cli.apellido,
          telefono: cli.telefono,
          email: cli.email,
          direccion: cli.direccion,
          notas: cli.notas
        }
      });
      const data = await res.json();
      if (res.ok() && data.data) {
        createdClients.push(data.data);
      }
    }

    return { createdEmployees, createdClients };
  }

  /**
   * Validar Paginado y Búsqueda en la Tabla de Clientes de la UI
   */
  static async testClientsTablePaginationUI(page: Page) {
    await page.goto('/admin/clientes', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Verificar que la tabla cargó
    const rowsSelector = 'table tbody tr';
    await page.waitForSelector(rowsSelector, { timeout: 10000 });
    
    const initialRows = await page.locator(rowsSelector).count();
    expect(initialRows).toBeGreaterThan(0);

    // Buscar botón de Siguiente Página si existe
    const nextBtn = page.locator('button:has-text("Siguiente"), button:has-text(">"), [aria-label="Página siguiente"]');
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(500); // Dar tiempo al renderizado de React
      const page2Rows = await page.locator(rowsSelector).count();
      expect(page2Rows).toBeGreaterThan(0);
    }
  }

  /**
   * Módulo 6: Abrir Caja
   */
  static async ensureCashRegisterOpen(token: string, montoInicial = 10000) {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const checkRes = await apiContext.get('/api/cajas/actual', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (checkRes.ok()) {
      const checkData = await checkRes.json();
      if (checkData.data && checkData.data.estadoCaja === 'Abierta') {
        return checkData.data;
      }
    }

    const openRes = await apiContext.post('/api/cajas/abrir', {
      headers: { Authorization: `Bearer ${token}` },
      data: { montoInicial }
    });

    const openData = await openRes.json();
    return openData.data;
  }

  /**
   * Módulo 6 & 7: Crear Pedidos y Hacerlos Avanzar por Estados
   */
  static async seedOrdersWithLifecycleViaApi(
    token: string,
    clients: any[],
    services: any[]
  ) {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const createdOrders: any[] = [];

    // Definir ciclo de estados objetivo para variaciones de pedidos
    const targetStates = ['PENDIENTE', 'EN_LAVADO', 'EN_PROCESO', 'LISTO', 'ENTREGADO', 'ENTREGADO'];

    for (let i = 0; i < 8; i++) {
      const client = clients[i % clients.length];
      const service1 = services[i % services.length];
      const service2 = services[(i + 1) % services.length];

      // 1. Crear Pedido (Empieza en PENDIENTE)
      const orderRes = await apiContext.post('/api/pedidos', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          idCliente: client.id,
          observaciones: `Pedido de prueba E2E #${i + 1}`,
          items: [
            { idServicio: service1.id, cantidad: 1, precioUnitario: service1.precio },
            { idServicio: service2.id, cantidad: 2, precioUnitario: service2.precio }
          ]
        }
      });

      const orderData = await orderRes.json();
      if (orderRes.ok() && orderData.data) {
        let order = orderData.data;
        const targetState = targetStates[i % targetStates.length];

        // 2. Hacer pasar el pedido secuencialmente por sus estados
        const sequence = ['EN_LAVADO', 'EN_PROCESO', 'LISTO', 'ENTREGADO'];
        for (const st of sequence) {
          if (order.estado === targetState) break;

          const patchRes = await apiContext.patch(`/api/pedidos/${order.id}/estado`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { estado: st }
          });
          if (patchRes.ok()) {
            const patchedData = await patchRes.json();
            order = patchedData.data || order;
          }

          if (st === targetState) break;
        }

        createdOrders.push(order);
      }
    }

    return createdOrders;
  }

  /**
   * Módulo 8: Registrar Cobros (1 Pedido por Transacción) y Probar Vuelto a Favor
   */
  static async seedPaymentsAndCreditBalance(
    token: string,
    orders: any[]
  ) {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const payments: any[] = [];

    // Tomar pedidos que estén ENTREGADOS y no cobrados
    const entregados = orders.filter((o) => o.estado === 'ENTREGADO' && !o.cobrado);

    if (entregados.length > 0) {
      // Cobro 1: Efectivo con monto superior para dejar Vuelto a Favor
      const p1 = entregados[0];
      const montoTotal = Number(p1.total || p1.montoTotal || 5000);
      const pagoExcedente = montoTotal + 2000;

      const payRes1 = await apiContext.post('/api/pagos', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          idPedido: p1.id,
          montoAbonado: pagoExcedente,
          montoTotal: montoTotal,
          metodoPago: 'EFECTIVO',
          dejarVueltoAFavor: true
        }
      });

      if (payRes1.ok()) {
        payments.push(await payRes1.json());
      }
    }

    if (entregados.length > 1) {
      // Cobro 2: Pago exacto con Transferencia
      const p2 = entregados[1];
      const montoTotal = Number(p2.total || p2.montoTotal || 4000);

      const payRes2 = await apiContext.post('/api/pagos', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          idPedido: p2.id,
          montoAbonado: montoTotal,
          montoTotal: montoTotal,
          metodoPago: 'TRANSFERENCIA',
          dejarVueltoAFavor: false
        }
      });

      if (payRes2.ok()) {
        payments.push(await payRes2.json());
      }
    }

    return payments;
  }
}
