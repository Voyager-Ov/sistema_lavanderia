import { APIRequestContext, expect } from '@playwright/test';
import { generateRandomEmail, generateRandomPhone, TEST_PASSWORDS, uniqueId } from './test-data';

export interface TenantAdminContext {
  token: string;
  admin: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
  };
  negocioId: number;
  headers: {
    Authorization: string;
    'Content-Type': string;
  };
  credentials: {
    email: string;
    password: string;
  };
}

export interface TenantWithEmpleadoContext extends TenantAdminContext {
  empleadoToken: string;
  empleado: {
    id: number;
    nombre: string;
    email: string;
    rol: string;
  };
  empleadoHeaders: {
    Authorization: string;
    'Content-Type': string;
  };
  empleadoCredentials: {
    email: string;
    password: string;
  };
}

/**
 * Crea un tenant y su usuario administrador verificado para pruebas
 */
export async function createTenantAdmin(
  request: APIRequestContext,
  options?: { negocioNombre?: string; adminNombre?: string; email?: string; password?: string }
): Promise<TenantAdminContext> {
  const negocioNombre = options?.negocioNombre || `Lavanderia_${uniqueId()}`;
  const usuarioNombre = options?.adminNombre || `Admin_${uniqueId()}`;
  const email = options?.email || generateRandomEmail('admin');
  const password = options?.password || TEST_PASSWORDS.ADMIN;

  // 1. Registro
  const registerRes = await request.post('/api/auth/register', {
    data: {
      negocioNombre,
      usuarioNombre,
      email,
      password
    }
  });
  expect(registerRes.status()).toBe(201);
  const registerData = await registerRes.json();
  const verificationCode = registerData.data?.verificationCode || registerData.verificationCode;

  // 2. Verificación de Email
  if (verificationCode) {
    const verifyRes = await request.post('/api/auth/verify-email', {
      data: {
        email,
        code: verificationCode
      }
    });
    expect(verifyRes.status()).toBe(200);
  }

  // 3. Login
  const loginRes = await request.post('/api/auth/login', {
    data: {
      email,
      password
    }
  });
  expect(loginRes.status()).toBe(200);
  const loginData = await loginRes.json();

  const token = loginData.data.token;
  const admin = loginData.data.usuario;

  // Obtener negocioId a través de /api/auth/me
  const meRes = await request.get('/api/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const meData = await meRes.json();
  const negocioId = meData.data?.negocioId ?? meData.data?.negocio?.id;
  if (!negocioId) {
    throw new Error(
      `[auth.fixture] No se pudo resolver negocioId desde GET /api/auth/me. ` +
      `Respuesta recibida: ${JSON.stringify(meData)}`
    );
  }

  return {
    token,
    admin,
    negocioId,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    credentials: {
      email,
      password
    }
  };
}

/**
 * Crea un tenant con Admin y un Empleado asociado
 */
export async function createTenantWithEmpleado(
  request: APIRequestContext,
  options?: { adminNombre?: string; empleadoNombre?: string }
): Promise<TenantWithEmpleadoContext> {
  const adminContext = await createTenantAdmin(request, { adminNombre: options?.adminNombre });

  const empleadoNombre = options?.empleadoNombre || `Empleado_${uniqueId()}`;
  const empleadoEmail = generateRandomEmail('empleado');
  const empleadoPassword = TEST_PASSWORDS.EMPLEADO;

  // Admin crea empleado vía /api/usuarios
  const createEmpRes = await request.post('/api/usuarios', {
    headers: adminContext.headers,
    data: {
      nombre: empleadoNombre,
      email: empleadoEmail,
      password: empleadoPassword,
      rol: 'EMPLEADO',
      telefono: generateRandomPhone()
    }
  });
  expect(createEmpRes.status()).toBe(201);
  const createEmpData = await createEmpRes.json();
  const empleadoUser = createEmpData.data || createEmpData;
  const empVerificationCode = empleadoUser.verificationCode || createEmpData.verificationCode;

  // Verificación de email del empleado
  if (empVerificationCode) {
    const verifyEmpRes = await request.post('/api/auth/verify-email', {
      data: {
        email: empleadoEmail,
        code: empVerificationCode
      }
    });
    expect(verifyEmpRes.status()).toBe(200);
  }

  // Login de empleado
  const loginEmpRes = await request.post('/api/auth/login', {
    data: {
      email: empleadoEmail,
      password: empleadoPassword
    }
  });
  expect(loginEmpRes.status()).toBe(200);
  const loginEmpData = await loginEmpRes.json();
  const empleadoToken = loginEmpData.data.token;

  return {
    ...adminContext,
    empleadoToken,
    empleado: {
      id: empleadoUser.id || loginEmpData.data.usuario.id,
      nombre: empleadoNombre,
      email: empleadoEmail,
      rol: 'EMPLEADO'
    },
    empleadoHeaders: {
      Authorization: `Bearer ${empleadoToken}`,
      'Content-Type': 'application/json'
    },
    empleadoCredentials: {
      email: empleadoEmail,
      password: empleadoPassword
    }
  };
}

/**
 * Inyecta el estado de autenticación en el localStorage del navegador para pruebas de UI
 */
export async function injectAuthState(
  page: any,
  user: { id: number; nombre: string; email: string; rol: string },
  token: string
) {
  await page.addInitScript(
    (authData: { user: any; token: string }) => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user: authData.user,
            token: authData.token,
            isAuthenticated: true
          },
          version: 0
        })
      );
    },
    { user, token }
  );
}

