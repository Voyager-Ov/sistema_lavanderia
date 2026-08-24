import { Page } from '@playwright/test';

/**
 * Helper para interceptar y mockear llamadas a la API de autenticación en tests de Playwright.
 */
export const AuthMockHelper = {
  /**
   * Simula un login exitoso
   */
  async mockLoginSuccess(
    page: Page,
    options?: {
      email?: string;
      nombre?: string;
      rol?: 'ADMIN' | 'SUPER_ADMIN' | 'EMPLEADO';
      negocioId?: number;
    }
  ) {
    const rol = options?.rol || 'ADMIN';
    const email = options?.email || 'admin@lavanderia.com';
    const nombre = options?.nombre || 'Admin Test';
    const negocioId = options?.negocioId || 1;

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Autenticación exitosa',
          data: {
            token: 'mock-jwt-token-xyz-123',
            usuario: {
              id: 10,
              email,
              nombre,
              rol,
              negocioId,
              googleLinked: false
            }
          }
        })
      });
    });
  },

  /**
   * Simula un error de login (401, 403, etc.)
   */
  async mockLoginError(page: Page, status: number, message: string, errorCode?: string) {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'fail',
          message,
          errorCode: errorCode || 'AUTH_ERROR'
        })
      });
    });
  },

  /**
   * Simula un registro exitoso de solicitud de negocio
   */
  async mockRegisterSuccess(
    page: Page,
    options?: { id?: number; email?: string; negocioNombre?: string; estado?: string }
  ) {
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Solicitud enviada exitosamente',
          data: {
            solicitud: {
              id: options?.id || 100,
              email: options?.email || 'solicitante@test.com',
              nombreNegocio: options?.negocioNombre || 'Lavandería Test',
              estado: options?.estado || 'PENDIENTE'
            }
          }
        })
      });
    });
  },

  /**
   * Simula un error en el registro (400, 409)
   */
  async mockRegisterError(page: Page, status: number, message: string) {
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'fail',
          message
        })
      });
    });
  },

  /**
   * Simula verificación de correo exitosa
   */
  async mockVerifyEmailSuccess(page: Page) {
    await page.route('**/api/auth/verify-email', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Correo electrónico verificado exitosamente.'
        })
      });
    });
  },

  /**
   * Simula error en verificación de correo
   */
  async mockVerifyEmailError(page: Page, message: string) {
    await page.route('**/api/auth/verify-email', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'fail',
          message
        })
      });
    });
  },

  /**
   * Simula reenvío de código exitoso
   */
  async mockResendVerificationSuccess(page: Page) {
    await page.route('**/api/auth/resend-verification', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Código de verificación reenviado exitosamente.'
        })
      });
    });
  },

  /**
   * Simula forgot password exitoso
   */
  async mockForgotPasswordSuccess(page: Page) {
    await page.route('**/api/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Si el correo ingresado coincide con una cuenta activa, recibirás las instrucciones.'
        })
      });
    });
  },

  /**
   * Simula reset password exitoso
   */
  async mockResetPasswordSuccess(page: Page) {
    await page.route('**/api/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Contraseña actualizada exitosamente.'
        })
      });
    });
  },

  /**
   * Simula reset password con error (token inválido / expirado)
   */
  async mockResetPasswordError(page: Page, message: string) {
    await page.route('**/api/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'fail',
          message
        })
      });
    });
  }
};
