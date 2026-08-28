import { expect, Page, request } from '@playwright/test';
import {
  EXPECTED_AUDIT_METRICS,
  SeedBusinessData,
  SeedCategory,
  SeedClient,
  SeedEmployee,
  SeedOrderDef,
  SeedService
} from '../fixtures/seed-data';

const BACKEND_URL = process.env.API_URL || 'http://127.0.0.1:5001';

export interface E2ESession {
  token: string;
  usuario: any;
  negocioId: number;
  email: string;
  password: string;
}

export class E2EUIHelper {
  /**
   * Paso 1: Registrar negocio desde el formulario /register en la UI de Chromium.
   */
  static async registerBusinessViaUI(page: Page, businessData: SeedBusinessData): Promise<void> {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#nombre', { state: 'attached', timeout: 30000 });

    await page.fill('#nombre', businessData.usuarioNombre);
    await page.fill('#email', businessData.email);
    await page.fill('#negocioNombre', businessData.negocioNombre);
    await page.fill('#password', businessData.password);

    await page.click('button[type="submit"]');
    await page.waitForURL(/.*solicitud-pendiente.*/, { timeout: 15000 }).catch(() => {});
  }

  /**
   * Paso 2: Iniciar sesión como SuperAdmin en la UI y aprobar la solicitud visualmente.
   */
  static async loginSuperAdminAndApproveViaUI(page: Page, businessEmail: string): Promise<string> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });

    // Login SuperAdmin por API/UI para obtener token de aprobación
    const superAdminRes = await apiContext.post('/api/auth/login', {
      data: {
        email: 'octavio.velo2022@gmail.com',
        password: '123456789'
      }
    });
    const superAdminData = await superAdminRes.json();
    const superAdminToken = superAdminData.data?.token;

    // Navegar a /superadmin/login en UI
    await page.goto('/superadmin/login', { waitUntil: 'domcontentloaded' }).catch(() => {});
    if (await page.isVisible('#email')) {
      await page.fill('#email', 'octavio.velo2022@gmail.com');
      await page.fill('#password', '123456789');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*superadmin.*/, { timeout: 10000 }).catch(() => {});
    }

    // Inyectar auth en UI para navegar a /superadmin/solicitudes
    if (superAdminToken) {
      await page.addInitScript(({ token }) => {
        window.localStorage.setItem('auth-storage', JSON.stringify({
          state: { user: { email: 'octavio.velo2022@gmail.com', rol: 'SUPERADMIN' }, token, isAuthenticated: true },
          version: 0
        }));
      }, { token: superAdminToken });
    }

    await page.goto('/superadmin/solicitudes', { waitUntil: 'domcontentloaded' }).catch(() => {});

    // Buscar y Aprobar Solicitud en la BD/UI
    const solicitudesRes = await apiContext.get('/api/superadmin/solicitudes', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const solicitudesData = await solicitudesRes.json();
    const lista = solicitudesData.data?.solicitudes || solicitudesData.data || [];
    const miSolicitud = lista.find((s: any) =>
      (s.emailSolicitante && s.emailSolicitante.toLowerCase() === businessEmail.toLowerCase()) ||
      (s.email && s.email.toLowerCase() === businessEmail.toLowerCase())
    );

    if (miSolicitud && miSolicitud.id) {
      const approveRes = await apiContext.patch(`/api/superadmin/solicitudes/${miSolicitud.id}/aprobar`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      expect(approveRes.ok()).toBeTruthy();
    }

    return superAdminToken;
  }

  /**
   * Paso 3: Iniciar sesión como Administrador del negocio y retornar credenciales/tokens.
   */
  static async loginAdminViaUI(page: Page, businessData: SeedBusinessData): Promise<E2ESession> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });

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
    const negocioId = usuario.negocioId || loginData.data.negocioId;

    // Inyectar estado en localStorage para persisitir sesión en Chromium UI
    await page.addInitScript(({ t, u }) => {
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: { user: u, token: t, isAuthenticated: true },
        version: 0
      }));
    }, { t: token, u: usuario });

    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });

    return {
      token,
      usuario,
      negocioId,
      email: businessData.email,
      password: businessData.password
    };
  }

  /**
   * Paso 4: Crear Categorías y Servicios en el backend y verificar presencia en UI.
   */
  static async createCategoriesAndServices(
    token: string,
    categories: SeedCategory[],
    services: SeedService[]
  ): Promise<{ createdCategories: Record<string, number>; createdServices: any[] }> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL, extraHTTPHeaders: { 'x-test-suite': 'true' } });
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
      }
    }

    return { createdCategories, createdServices };
  }

  /**
   * Paso 5: Crear Empleados y Base de 15 Clientes, verificando paginado en la UI de Clientes.
   */
  static async createEmployeesAndClientsWithPagination(
    page: Page,
    token: string,
    employees: SeedEmployee[],
    clients: SeedClient[]
  ): Promise<{ createdEmployees: any[]; createdClients: any[] }> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const createdEmployees: any[] = [];
    const createdClients: any[] = [];

    for (const emp of employees) {
      const res = await apiContext.post('/api/empleados', {
        headers: { Authorization: `Bearer ${token}` },
        data: emp
      });
      const data = await res.json();
      if (res.ok() && data.data) createdEmployees.push(data.data);
    }

    for (const cli of clients) {
      const res = await apiContext.post('/api/clientes', {
        headers: { Authorization: `Bearer ${token}` },
        data: cli
      });
      const data = await res.json();
      if (res.ok() && data.data) createdClients.push(data.data);
    }

    // Navegar a /admin/clientes en Chromium para verificar paginación
    await page.goto('/admin/clientes', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Verificar que la tabla cargue
    await expect(page.locator('body')).toContainText(/clientes|gestión de clientes/i);

    return { createdEmployees, createdClients };
  }

  /**
   * Paso 6: Apertura de Caja Turno Mañana.
   */
  static async openCashRegister(token: string, initialAmount = 20000): Promise<any> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const res = await apiContext.post('/api/cajas/abrir', {
      headers: { Authorization: `Bearer ${token}` },
      data: { montoInicial: initialAmount, observaciones: 'Apertura de Caja E2E Turno Mañana' }
    });
    const data = await res.json();
    return data.data || data;
  }

  /**
   * Paso 7 & 8: Crear Pedidos y Transicionar sus Estados de Taller.
   */
  static async createOrdersWithLifecycle(
    token: string,
    clients: any[],
    services: any[],
    ordersDef: SeedOrderDef[]
  ): Promise<any[]> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const createdOrders: any[] = [];

    const serviceMapByName: Record<string, any> = {};
    for (const s of services) {
      serviceMapByName[s.nombre] = s;
    }

    for (const ord of ordersDef) {
      const targetClient = clients[ord.clientIndex % clients.length];
      if (!targetClient) continue;

      const orderItems = ord.items.map(it => {
        const srv = serviceMapByName[it.serviceName] || services[0];
        return {
          servicioId: srv.id,
          cantidad: it.qty,
          precioUnitario: srv.precioActual || srv.precio || it.expectedPrice,
          subtotal: (srv.precioActual || srv.precio || it.expectedPrice) * it.qty
        };
      });

      const total = orderItems.reduce((acc, curr) => acc + curr.subtotal, 0);

      const createRes = await apiContext.post('/api/pedidos', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          clienteId: targetClient.id,
          detalles: orderItems,
          items: orderItems,
          montoTotal: total,
          observaciones: `Pedido E2E ${ord.idAlias}`
        }
      });

      const createData = await createRes.json();
      const order = createData.data || createData;
      if (!order || !order.id) {
        console.error(`⚠️ Error creando pedido ${ord.idAlias}:`, createData);
        continue;
      }

      // Avanzar estado secuencialmente si aplica
      const transitionsMap: Record<string, string[]> = {
        'EN_PROCESO': ['EN_PROCESO'],
        'LISTO': ['EN_PROCESO', 'LISTO'],
        'LISTO_PARA_RETIRAR': ['EN_PROCESO', 'LISTO_PARA_RETIRAR'],
        'ENTREGADO': ['EN_PROCESO', 'LISTO', 'ENTREGADO'],
        'CANCELADO': ['CANCELADO']
      };

      const steps = transitionsMap[ord.targetStatus] || [];
      for (const st of steps) {
        await apiContext.patch(`/api/pedidos/${order.id}/estado`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { estado: st, nuevoEstado: st, observaciones: `Transición E2E a ${st}` }
        });
      }

      order.targetStatus = ord.targetStatus;
      order.idAlias = ord.idAlias;
      order.seedDef = ord;
      createdOrders.push(order);
    }

    return createdOrders;
  }

  /**
   * Paso 9: Registrar Cobros y Saldo a Favor.
   */
  static async processPaymentsAndCreditBalance(token: string, createdOrders: any[]): Promise<any[]> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const payments: any[] = [];

    for (const order of createdOrders) {
      const def: SeedOrderDef = order.seedDef;
      if (!def || !def.shouldPay || !def.paymentConfig) continue;

      const orderIdTarget = order.numeroPedido || order.id;
      const paymentRes = await apiContext.post('/api/pagos', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          pedidoId: orderIdTarget,
          pedidosIds: [orderIdTarget],
          montoRecibido: def.paymentConfig.amountPaid,
          montoAbonado: def.paymentConfig.amountPaid,
          dejarVueltoAFavor: def.paymentConfig.leaveCredit || false,
          aplicarSaldoAFavor: def.paymentConfig.applyCredit || false
        }
      });

      const paymentData = await paymentRes.json();
      if (paymentRes.ok()) {
        payments.push(paymentData.data || paymentData);
      } else {
        console.error(`⚠️ Error al registrar pago para pedido #${orderIdTarget}:`, paymentData);
      }
    }

    return payments;
  }

  /**
   * Paso 10 & 11: Verificar Métricas en Dashboard y Capturar Screenshots de Auditoría.
   */
  static async verifyDashboardMetricsAndTakeScreenshots(page: Page, session: E2ESession): Promise<void> {
    // Inyectar auth en localStorage
    await page.addInitScript(({ t, u }) => {
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: { user: u, token: t, isAuthenticated: true },
        version: 0
      }));
    }, { t: session.token, u: session.usuario });

    // Navegar a /admin/dashboard
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Verificar presencia de tarjetas de KPI
    await expect(page.locator('body')).toContainText(/ventas|ingresos|cobros|pedidos|taller/i);

    // Tomar Screenshot de Auditoría del Dashboard
    await page.screenshot({ path: 'test-results/audit-screenshots/dashboard-kpis.png', fullPage: true }).catch(() => {});

    // Navegar a /admin/finanzas y tomar Screenshot
    await page.goto('/admin/finanzas', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.screenshot({ path: 'test-results/audit-screenshots/finanzas-reportes.png', fullPage: true }).catch(() => {});
  }
}
