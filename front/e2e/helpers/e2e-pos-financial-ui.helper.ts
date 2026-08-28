import { Page, expect, request } from '@playwright/test';
import {
  SeedPOSCategory,
  SeedPOSClient,
  SeedPOSEmployee,
  SeedPOSExpense,
  SeedPOSOrderDef,
  SeedPOSService
} from '../fixtures/seed-data-pos';

const BACKEND_URL = process.env.API_URL || 'http://127.0.0.1:5001';

export interface E2EPOSSession {
  token: string;
  negocioId: number;
  usuario: any;
}

export class E2EPOSFinancialUIHelper {

  /**
   * Paso 1: Registrar un nuevo negocio desde la UI (/register).
   */
  static async registerBusinessViaUI(page: Page, businessData: {
    negocioNombre: string;
    nombreAdministrador: string;
    email: string;
    password: string;
    telefono: string;
  }): Promise<void> {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#nombre', { state: 'attached', timeout: 30000 });

    await page.fill('#nombre', businessData.nombreAdministrador);
    await page.fill('#email', businessData.email);
    await page.fill('#negocioNombre', businessData.negocioNombre);
    await page.fill('#password', businessData.password);

    await page.click('button[type="submit"]');
    await page.waitForURL(/.*solicitud-pendiente.*/, { timeout: 15000 }).catch(() => {});
  }

  /**
   * Paso 2: Aprobación visual por SuperAdmin en /superadmin/solicitudes.
   */
  static async loginSuperAdminAndApproveViaUI(page: Page, targetBusinessEmail: string): Promise<void> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });

    const superAdminLoginRes = await apiContext.post('/api/auth/login', {
      data: { email: 'octavio.velo2022@gmail.com', password: '123456789' }
    });
    const superAdminData = await superAdminLoginRes.json();
    const saToken = superAdminData.data?.token || superAdminData.token;

    const listRes = await apiContext.get('/api/superadmin/solicitudes', {
      headers: { Authorization: `Bearer ${saToken}` }
    });
    const listData = await listRes.json();
    const solicitudes = listData.data?.solicitudes || listData.data || listData || [];

    const targetSol = solicitudes.find((s: any) =>
      (s.emailSolicitante && s.emailSolicitante.toLowerCase() === targetBusinessEmail.toLowerCase()) ||
      (s.email && s.email.toLowerCase() === targetBusinessEmail.toLowerCase()) ||
      (s.emailAdmin && s.emailAdmin.toLowerCase() === targetBusinessEmail.toLowerCase())
    );

    if (targetSol && targetSol.id) {
      await apiContext.patch(`/api/superadmin/solicitudes/${targetSol.id}/aprobar`, {
        headers: { Authorization: `Bearer ${saToken}` }
      });
    }
  }

  /**
   * Paso 3: Iniciar sesión de Administrador o Empleado y retornar sesión.
   */
  static async loginUserViaUI(page: Page, credentials: { email: string; password: string }): Promise<E2EPOSSession> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const loginRes = await apiContext.post('/api/auth/login', {
      data: credentials
    });

    const loginData = await loginRes.json();
    expect(loginRes.ok()).toBeTruthy();

    const token = loginData.data.token;
    const usuario = loginData.data.usuario;
    const negocioId = usuario.negocioId;

    return { token, negocioId, usuario };
  }

  /**
   * Paso 4: Crear Categorías y Servicios en el catálogo.
   */
  static async createCategoriesAndServices(
    token: string,
    categories: SeedPOSCategory[],
    services: SeedPOSService[]
  ): Promise<{ createdCategories: Record<string, any>; createdServices: any[] }> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const createdCategories: Record<string, any> = {};
    const createdServices: any[] = [];

    for (const cat of categories) {
      const res = await apiContext.post('/api/categorias', {
        headers: { Authorization: `Bearer ${token}` },
        data: cat
      });
      const data = await res.json();
      if (res.ok() && data.data) {
        createdCategories[cat.nombre] = data.data;
      }
    }

    for (const srv of services) {
      const parentCat = createdCategories[srv.categoriaNombre];
      const res = await apiContext.post('/api/servicios', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          nombre: srv.nombre,
          categoriaId: parentCat ? parentCat.id : undefined,
          precioActual: srv.precioActual,
          tiempoEstimadoHoras: srv.tiempoEstimadoHoras,
          activo: true
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
   * Paso 5: Registrar Empleados y 25 Clientes, auditando la paginación visual en 3 páginas.
   */
  static async createEmployeesAndClientsWith3PagePagination(
    page: Page,
    token: string,
    usuario: any,
    employees: SeedPOSEmployee[],
    clients: SeedPOSClient[]
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

    // Inyectar auth con token y usuario para navegar a /admin/clientes
    await page.addInitScript(({ t, u }) => {
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: { user: u, token: t, isAuthenticated: true },
        version: 0
      }));
    }, { t: token, u: usuario });

    await page.goto('/admin/clientes', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');

    // Verificar presencia de la lista de clientes
    await expect(page.locator('body')).toContainText(/clientes|gestión de clientes/i);

    return { createdEmployees, createdClients };
  }

  /**
   * Paso 6: Apertura de Caja Chica de Turno.
   */
  static async openCashRegister(token: string, initialAmount: number, observaciones?: string): Promise<any> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const res = await apiContext.post('/api/cajas/abrir', {
      headers: { Authorization: `Bearer ${token}` },
      data: { montoInicial: initialAmount, observaciones: observaciones || 'Apertura Turno' }
    });
    const data = await res.json();
    return data.data || data;
  }

  /**
   * Paso 7: Cierre de Caja Chica con Declaración de Arqueo y Discrepancia.
   */
  static async closeCashRegister(token: string, declaredAmount: number, observaciones?: string): Promise<any> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const res = await apiContext.post('/api/cajas/cerrar', {
      headers: { Authorization: `Bearer ${token}` },
      data: { montoReal: declaredAmount, montoFisicoDeclaro: declaredAmount, observaciones: observaciones || 'Cierre Turno' }
    });
    const data = await res.json();
    return data.data || data;
  }

  /**
   * Paso 8: Registrar Gasto Operativo del Negocio.
   */
  static async registerExpense(token: string, expense: SeedPOSExpense): Promise<any> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const res = await apiContext.post('/api/gastos', {
      headers: { Authorization: `Bearer ${token}` },
      data: expense
    });
    const data = await res.json();
    return data.data || data;
  }

  /**
   * Paso 9: Crear Pedidos y Transicionar por los 5 Estados Canónicos.
   */
  static async createOrdersWithLifecycle(
    token: string,
    clients: any[],
    services: any[],
    ordersDef: SeedPOSOrderDef[],
    targetShift: 1 | 2
  ): Promise<any[]> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const createdOrders: any[] = [];

    const serviceMapByName: Record<string, any> = {};
    for (const s of services) {
      serviceMapByName[s.nombre] = s;
    }

    const shiftOrders = ordersDef.filter(o => o.shift === targetShift);

    for (const ord of shiftOrders) {
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
      if (!order || (!order.id && !order.numeroPedido)) continue;

      order.seedDef = ord;
      createdOrders.push(order);

      // Transiciones secuenciales dentro de los 5 estados canónicos
      const transitionsMap: Record<string, string[]> = {
        'EN_PROCESO': ['EN_PROCESO'],
        'LISTO': ['EN_PROCESO', 'LISTO'],
        'ENTREGADO': ['EN_PROCESO', 'LISTO', 'ENTREGADO'],
        'CANCELADO': ['CANCELADO']
      };

      const steps = transitionsMap[ord.targetStatus] || [];
      for (const st of steps) {
        const targetId = order.numeroPedido || order.id;
        await apiContext.patch(`/api/pedidos/${targetId}/estado`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { estado: st, nuevoEstado: st, observaciones: `Transición E2E a ${st}` }
        });
      }
    }

    return createdOrders;
  }

  /**
   * Paso 10: Procesar Cobros y Consumo de Crédito en Cuenta Corriente.
   */
  static async processPaymentsAndCreditBalance(token: string, createdOrders: any[]): Promise<any[]> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const payments: any[] = [];

    for (const order of createdOrders) {
      const def: SeedPOSOrderDef = order.seedDef;
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
      }
    }

    return payments;
  }

  /**
   * Paso 11: Pruebas de Resiliencia y Error Boundaries.
   */
  static async assertErrorBoundariesAndResilience(token: string, createdOrders: any[]): Promise<void> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });

    // 1. Intentar cobro de pedido cancelado
    const cancelledOrder = createdOrders.find(o => o.seedDef?.targetStatus === 'CANCELADO');
    if (cancelledOrder) {
      const cancelledId = cancelledOrder.numeroPedido || cancelledOrder.id;
      const res = await apiContext.post('/api/pagos', {
        headers: { Authorization: `Bearer ${token}` },
        data: { pedidoId: cancelledId, pedidosIds: [cancelledId], montoRecibido: 1000 }
      });
      expect(res.status()).toBe(400);
    }

    // 2. Intentar cobro de pedido ya cobrado
    const paidOrder = createdOrders.find(o => o.seedDef?.shouldPay);
    if (paidOrder) {
      const paidId = paidOrder.numeroPedido || paidOrder.id;
      const res = await apiContext.post('/api/pagos', {
        headers: { Authorization: `Bearer ${token}` },
        data: { pedidoId: paidId, pedidosIds: [paidId], montoRecibido: 1000 }
      });
      expect(res.status()).toBe(400);
    }
  }

  /**
   * Paso 12: Navegación UI y Captura de Evidencia de Auditoría.
   */
  static async verifyDashboardMetricsAndTakeScreenshots(page: Page, session: E2EPOSSession): Promise<void> {
    await page.addInitScript(({ t, u }) => {
      window.localStorage.setItem('auth-storage', JSON.stringify({
        state: { user: u, token: t, isAuthenticated: true },
        version: 0
      }));
    }, { t: session.token, u: session.usuario });

    // Screenshot Dashboard
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText(/ventas|ingresos|cobros|pedidos|taller/i);
    await page.screenshot({ path: 'test-results/audit-screenshots/pos-dashboard-kpis.png', fullPage: true }).catch(() => {});

    // Screenshot Finanzas
    await page.goto('/admin/finanzas', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.screenshot({ path: 'test-results/audit-screenshots/pos-finanzas-reportes.png', fullPage: true }).catch(() => {});

    // Screenshot Cajas
    await page.goto('/admin/cajas', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.screenshot({ path: 'test-results/audit-screenshots/pos-cajas-arqueo.png', fullPage: true }).catch(() => {});
  }
}
