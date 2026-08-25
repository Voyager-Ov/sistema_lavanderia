import { Page, request } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BACKEND_URL = process.env.API_URL || 'http://localhost:5001';
const SESSION_FILE = path.join(process.cwd(), 'e2e', '.live-dashboard-session.json');

export interface LiveDashboardSession {
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

export class LiveDashboardHelper {
  private static cachedSession: LiveDashboardSession | null = null;

  /**
   * Crea un negocio real, lo aprueba con la cuenta SuperAdmin y retorna las credenciales de admin autenticado.
   */
  static async setupLiveTenantAndAdmin(): Promise<LiveDashboardSession> {
    if (this.cachedSession) {
      return this.cachedSession;
    }

    if (fs.existsSync(SESSION_FILE)) {
      try {
        const saved = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
        if (saved && saved.token) {
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
        // regenerate if corrupt
      }
    }

    const apiContext = await request.newContext({ baseURL: BACKEND_URL });

    const timestamp = Date.now();
    const adminEmail = `admin_dash_${timestamp}@lavanderia.test`;
    const adminPassword = 'Password123!';
    const negocioNombre = `Lavanderia Dashboard ${timestamp}`;

    // 1. Registro público de solicitud de apertura de negocio
    const regRes = await apiContext.post('/api/auth/register', {
      data: {
        usuarioNombre: 'Admin Dashboard Live',
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
  static async injectLiveSession(page: Page, session: LiveDashboardSession) {
    await page.context().addCookies([
      {
        name: 'token',
        value: session.token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax'
      }
    ]);

    await page.addInitScript((s) => {
      const authState = {
        token: s.token,
        usuario: s.usuario,
        negocio: s.negocio,
        isAuthenticated: true
      };
      localStorage.setItem('auth-storage', JSON.stringify({ state: authState, version: 0 }));
      localStorage.setItem('token', s.token);
    }, session);
  }

  /**
   * Crea un cliente real vía API
   */
  static async createLiveClientViaApi(token: string, data: { nombre: string; telefono?: string; email?: string }): Promise<any> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const res = await apiContext.post('/api/clientes', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data
    });

    if (!res.ok()) {
      throw new Error(`Error creando cliente via API: ${await res.text()}`);
    }

    const json = await res.json();
    return json.data;
  }

  /**
   * Abre un turno de caja vía API
   */
  static async openLiveCajaViaApi(token: string, montoInicial: number = 5000): Promise<any> {
    const apiContext = await request.newContext({ baseURL: BACKEND_URL });
    const res = await apiContext.post('/api/cajas/abrir', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { montoInicial }
    });

    if (!res.ok()) {
      return null;
    }

    const json = await res.json();
    return json.data;
  }
}
