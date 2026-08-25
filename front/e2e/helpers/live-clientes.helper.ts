import { Page, request } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BACKEND_URL = process.env.API_URL || 'http://localhost:5001';
const SESSION_FILE = path.join(process.cwd(), 'e2e', '.live-session.json');

export interface LiveTenantSession {
  token: string;
  usuario: {
    id: number;
    email: string;
    nombre: string;
    rol: string;
    negocioId: number;
    googleLinked: boolean;
  };
  negocio: {
    id: number;
    nombre: string;
    subdominio: string;
  };
  adminEmail: string;
  adminPassword: string;
}

export class LiveClientesHelper {
  private static cachedSession: LiveTenantSession | null = null;

  /**
   * Crea un negocio real, lo aprueba con la cuenta SuperAdmin y retorna las credenciales de admin autenticado.
   */
  static async setupLiveTenantAndAdmin(): Promise<LiveTenantSession> {
    if (this.cachedSession) {
      return this.cachedSession;
    }

    if (fs.existsSync(SESSION_FILE)) {
      try {
        const saved = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
        if (saved && saved.token) {
          // Validar que el token siga activo
          const apiContext = await request.newContext({ baseURL: BACKEND_URL });
          const testRes = await apiContext.get('/api/auth/perfil', {
            headers: { Authorization: `Bearer ${saved.token}` }
          });
          if (testRes.ok()) {
            this.cachedSession = saved;
            return saved;
          }
        }
      } catch (e) {
        // regenerate
      }
    }

    const apiContext = await request.newContext({ baseURL: BACKEND_URL });

    const timestamp = Date.now();
    const adminEmail = `admin_live_${timestamp}@lavanderia.test`;
    const adminPassword = 'Password123!';
    const negocioNombre = `Lavanderia Live ${timestamp}`;

    // 1. Registro público de solicitud de apertura de negocio
    const regRes = await apiContext.post('/api/auth/register', {
      data: {
        usuarioNombre: 'Admin Live E2E',
        email: adminEmail,
        password: adminPassword,
        negocioNombre: negocioNombre,
        telefono: '1122334455'
      }
    });

    const regData = await regRes.json();
    if (!regRes.ok()) {
      throw new Error(`Error en registro de negocio: ${JSON.stringify(regData)}`);
    }

    const solicitudId = regData.data?.solicitud?.id;

    // 2. Login con la cuenta SuperAdmin del usuario
    const superAdminRes = await apiContext.post('/api/auth/login', {
      data: {
        email: 'octavio.velo2022@gmail.com',
        password: '123456789'
      }
    });

    const superAdminData = await superAdminRes.json();
    if (!superAdminRes.ok() || !superAdminData.data?.token) {
      throw new Error(`Error al autenticar SuperAdmin: ${JSON.stringify(superAdminData)}`);
    }

    const superAdminToken = superAdminData.data.token;

    // 3. Aprobar la solicitud para aprovisionar el esquema tenant en PostgreSQL
    if (solicitudId) {
      const approveRes = await apiContext.patch(`/api/superadmin/solicitudes/${solicitudId}/aprobar`, {
        headers: {
          Authorization: `Bearer ${superAdminToken}`
        }
      });

      if (!approveRes.ok()) {
        const err = await approveRes.json();
        throw new Error(`Error al aprobar solicitud de tenant: ${JSON.stringify(err)}`);
      }
    }

    // 4. Iniciar sesión como el Administrador del nuevo Tenant
    const loginRes = await apiContext.post('/api/auth/login', {
      data: {
        email: adminEmail,
        password: adminPassword
      }
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok() || !loginData.data?.token) {
      throw new Error(`Error al loguear admin de tenant: ${JSON.stringify(loginData)}`);
    }

    this.cachedSession = {
      token: loginData.data.token,
      usuario: loginData.data.usuario,
      negocio: loginData.data.negocio || { id: loginData.data.usuario.negocioId, nombre: negocioNombre, subdominio: `sub-${timestamp}` },
      adminEmail,
      adminPassword
    };

    try {
      fs.writeFileSync(SESSION_FILE, JSON.stringify(this.cachedSession, null, 2));
    } catch (e) {}

    return this.cachedSession;
  }

  /**
   * Inyecta la sesión persistida en el localStorage del navegador para que el usuario esté autenticado.
   */
  static async injectLiveSession(page: Page, session: LiveTenantSession) {
    await page.addInitScript(({ token, usuario }) => {
      window.localStorage.removeItem('superadmin_token');
      window.localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: usuario,
            token: token,
            isAuthenticated: true
          },
          version: 0
        })
      );
    }, { token: session.token, usuario: session.usuario });
  }

  /**
   * Crea un cliente real vía API HTTP en el backend de back2
   */
  static async createLiveClientViaApi(token: string, clientData: { nombre: string; apellido?: string; telefono?: string; email?: string; direccion?: string }) {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const res = await apiContext.post('/api/clientes', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: clientData
    });

    const data = await res.json();
    if (!res.ok()) {
      throw new Error(`Error al crear cliente vía API: ${JSON.stringify(data)}`);
    }
    return data.data;
  }

  /**
   * Asegura que exista una caja abierta real en el turno activo
   */
  static async ensureLiveCashRegisterOpen(token: string, montoInicial = 5000) {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    
    // Verificar si ya está abierta
    const checkRes = await apiContext.get('/api/cajas/actual', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (checkRes.ok()) {
      const checkData = await checkRes.json();
      if (checkData.data && checkData.data.estadoCaja === 'Abierta') {
        return checkData.data;
      }
    }

    // Abrir caja
    const openRes = await apiContext.post('/api/cajas/abrir', {
      headers: { Authorization: `Bearer ${token}` },
      data: { montoInicial }
    });

    const openData = await openRes.json();
    return openData.data;
  }

  /**
   * Cierra la caja viva para probar compuertas de advertencia
   */
  static async closeLiveCashRegister(token: string) {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const checkRes = await apiContext.get('/api/cajas/actual', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (checkRes.ok()) {
      const checkData = await checkRes.json();
      if (checkData.data?.idCaja) {
        await apiContext.post(`/api/cajas/${checkData.data.idCaja}/cerrar`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { montoRealEfectivo: 5000 }
        });
      }
    }
  }
}
