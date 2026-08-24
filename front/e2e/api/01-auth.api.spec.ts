import { test, expect } from '@playwright/test';
import { generateRandomEmail, TEST_PASSWORDS, uniqueId } from '../fixtures/test-data';

test.describe('Módulo 01: API de Autenticación y Cuentas', () => {
  const registeredEmail = generateRandomEmail('admin_auth');
  let verificationCode: string;
  let authToken: string;

  test('POST /api/auth/register - Debe registrar exitosamente un nuevo Negocio y Admin (201)', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: {
        negocioNombre: `Lavanderia_${uniqueId()}`,
        usuarioNombre: 'Admin Principal',
        email: registeredEmail,
        password: TEST_PASSWORDS.VALID
      }
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toHaveProperty('usuario');
    expect(body.data.usuario.email).toBe(registeredEmail.toLowerCase());
    expect(body.data.usuario).not.toHaveProperty('passwordHash');

    verificationCode = body.data.verificationCode;
  });

  test('POST /api/auth/register - No debe permitir registrar un email duplicado (400)', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: {
        negocioNombre: 'Otra Lavanderia',
        usuarioNombre: 'Otro Usuario',
        email: registeredEmail,
        password: TEST_PASSWORDS.VALID
      }
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/email ya está en uso/i);
  });

  test('POST /api/auth/register - Debe rechazar contraseñas débiles o campos incompletos (400)', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: {
        negocioNombre: '',
        usuarioNombre: 'User',
        email: 'invalid-email',
        password: '123'
      }
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test('POST /api/auth/login - Debe rechazar inicio de sesión si el email no está verificado (403)', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: {
        email: registeredEmail,
        password: TEST_PASSWORDS.VALID
      }
    });

    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/verificar tu email/i);
  });

  test('POST /api/auth/verify-email - Debe verificar la cuenta con el código correcto (200)', async ({ request }) => {
    if (!verificationCode) {
      test.skip();
    }

    const res = await request.post('/api/auth/verify-email', {
      data: {
        email: registeredEmail,
        tokenConfirmacion: verificationCode
      }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.message).toBeDefined();
  });

  test('POST /api/auth/verify-email - Debe rechazar código de verificación incorrecto (400)', async ({ request }) => {
    const res = await request.post('/api/auth/verify-email', {
      data: {
        email: registeredEmail,
        tokenConfirmacion: '999999'
      }
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test('POST /api/auth/login - Debe iniciar sesión exitosamente con credenciales válidas (200)', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: {
        email: registeredEmail,
        password: TEST_PASSWORDS.VALID
      }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data).toHaveProperty('token');
    expect(body.data.usuario.email).toBe(registeredEmail.toLowerCase());

    authToken = body.data.token;
  });

  test('POST /api/auth/login - Debe rechazar contraseña incorrecta (401 o 403)', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: {
        email: registeredEmail,
        password: 'PasswordIncorrecta999'
      }
    });

    expect([401, 403]).toContain(res.status());
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test('GET /api/auth/me - Debe devolver el perfil con token válido (200)', async ({ request }) => {
    const res = await request.get('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.email).toBe(registeredEmail.toLowerCase());
  });

  test('GET /api/auth/me - Debe rechazar peticiones sin token (401)', async ({ request }) => {
    const res = await request.get('/api/auth/me');
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test('POST /api/auth/forgot-password & reset-password - Flujo de recuperación (200)', async ({ request }) => {
    const forgotRes = await request.post('/api/auth/forgot-password', {
      data: {
        email: registeredEmail
      }
    });
    expect(forgotRes.status()).toBe(200);
    const forgotBody = await forgotRes.json();
    const resetToken = forgotBody.data?.resetPasswordToken || forgotBody.resetPasswordToken;

    if (resetToken) {
      const newPass = 'NewSecurePassword123';
      const resetRes = await request.post('/api/auth/reset-password', {
        data: {
          token: resetToken,
          newPassword: newPass
        }
      });
      expect(resetRes.status()).toBe(200);

      // Iniciar sesión con la nueva contraseña
      const loginNewRes = await request.post('/api/auth/login', {
        data: {
          email: registeredEmail,
          password: newPass
        }
      });
      expect(loginNewRes.status()).toBe(200);
    }
  });

  test('POST /api/auth/reset-password - Debe rechazar token inválido (400)', async ({ request }) => {
    const res = await request.post('/api/auth/reset-password', {
      data: {
        token: 'token_falso_invalido_123',
        newPassword: 'NuevaPassword123'
      }
    });
    expect(res.status()).toBe(400);
  });
});
