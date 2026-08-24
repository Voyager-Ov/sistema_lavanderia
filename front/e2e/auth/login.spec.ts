import { test, expect } from '@playwright/test';
import { AuthMockHelper } from '../helpers/auth-mock.helper';

test.describe('E2E: Vista de Login (/login)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.goto('/login');
  });

  test('1. Debe mostrar validaciones visuales de Zod si los campos están vacíos', async ({ page }) => {
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByText('Ingresa un correo electrónico válido')).toBeVisible();
    await expect(page.getByText('La contraseña es obligatoria')).toBeVisible();
  });

  test('2. Debe iniciar sesión como Administrador y redirigir a /admin/dashboard', async ({ page }) => {
    await AuthMockHelper.mockLoginSuccess(page, {
      email: 'admin@lavanderia.com',
      rol: 'ADMIN'
    });

    await page.getByLabel('Tu email').fill('admin@lavanderia.com');
    await page.getByLabel('Contraseña').fill('PasswordSegura123!');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/.*\/admin\/dashboard/);
    await expect(page.getByText('¡Bienvenido!')).toBeVisible();
  });

  test('3. Debe iniciar sesión como SuperAdmin y redirigir a /superadmin/dashboard', async ({ page }) => {
    await AuthMockHelper.mockLoginSuccess(page, {
      email: 'superadmin@sistema.com',
      rol: 'SUPER_ADMIN'
    });

    await page.getByLabel('Tu email').fill('superadmin@sistema.com');
    await page.getByLabel('Contraseña').fill('SuperSecretPassword123!');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/.*\/superadmin\/dashboard/);
  });

  test('4. Debe iniciar sesión como Empleado y redirigir a /pos/pedidos', async ({ page }) => {
    await AuthMockHelper.mockLoginSuccess(page, {
      email: 'empleado@lavanderia.com',
      rol: 'EMPLEADO'
    });

    await page.getByLabel('Tu email').fill('empleado@lavanderia.com');
    await page.getByLabel('Contraseña').fill('EmpleadoPass123!');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/.*\/pos\/pedidos/);
  });

  test('5. Debe mostrar toast de error ante credenciales incorrectas (401)', async ({ page }) => {
    await AuthMockHelper.mockLoginError(page, 401, 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.', 'INVALID_CREDENTIALS');

    await page.getByLabel('Tu email').fill('wrong@user.com');
    await page.getByLabel('Contraseña').fill('WrongPassword123');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByText('Error al iniciar sesión')).toBeVisible();
    await expect(page.getByText('Credenciales inválidas')).toBeVisible();
  });

  test('6. Debe redirigir a /verify-email si la cuenta no ha sido verificada (403)', async ({ page }) => {
    await AuthMockHelper.mockLoginError(page, 403, 'Debes verificar tu email antes de ingresar.', 'EMAIL_NOT_VERIFIED');

    await page.getByLabel('Tu email').fill('unverified@lavanderia.com');
    await page.getByLabel('Contraseña').fill('Password123!');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/.*\/verify-email\?email=unverified%40lavanderia\.com/);
    await expect(page.getByText('Cuenta no verificada')).toBeVisible();
  });

  test('7. Debe redirigir a /solicitud-pendiente si la solicitud está en revisión (403)', async ({ page }) => {
    await AuthMockHelper.mockLoginError(page, 403, 'Tu solicitud de apertura de negocio aún está en revisión por el Super Admin.', 'REGISTRATION_PENDING');

    await page.getByLabel('Tu email').fill('pending@negocio.com');
    await page.getByLabel('Contraseña').fill('Password123!');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/.*\/solicitud-pendiente\?email=pending%40negocio\.com&status=PENDIENTE/);
  });

  test('8. Debe mostrar notificación si la URL contiene ?expired=true', async ({ page }) => {
    await page.goto('/login?expired=true');
    await expect(page.getByText('Sesión expirada')).toBeVisible();
  });
});
