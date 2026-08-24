import { test, expect } from '@playwright/test';
import { AuthMockHelper } from '../helpers/auth-mock.helper';

test.describe('E2E: Vista de Registro (/register)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('1. Debe mostrar validaciones visuales si los campos están vacíos o incompletos', async ({ page }) => {
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page.getByText('El nombre debe tener al menos 2 caracteres')).toBeVisible();
    await expect(page.getByText('Ingresa un correo electrónico válido')).toBeVisible();
    await expect(page.getByText('El nombre del negocio es obligatorio')).toBeVisible();
    await expect(page.getByText('La contraseña debe tener al menos 8 caracteres')).toBeVisible();
  });

  test('2. Debe enviar solicitud exitosa y redirigir a /solicitud-pendiente', async ({ page }) => {
    await AuthMockHelper.mockRegisterSuccess(page, {
      id: 55,
      email: 'nuevo.dueno@lavanderia.com',
      negocioNombre: 'Burbujas Express',
      estado: 'PENDIENTE'
    });

    await page.getByLabel('Nombre completo').fill('Carlos Méndez');
    await page.getByLabel('Tu email').fill('nuevo.dueno@lavanderia.com');
    await page.getByLabel('Nombre de tu lavandería').fill('Burbujas Express');
    await page.getByLabel('Crea tu contraseña').fill('PasswordSegura123!');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page).toHaveURL(/.*\/solicitud-pendiente\?email=nuevo\.dueno%40lavanderia\.com&negocio=Burbujas%20Express/);
    await expect(page.getByText('Solicitud enviada')).toBeVisible();
  });

  test('3. Debe mostrar toast de error ante conflicto (409 Email en uso)', async ({ page }) => {
    await AuthMockHelper.mockRegisterError(page, 409, 'El correo electrónico ya se encuentra registrado activamente.');

    await page.getByLabel('Nombre completo').fill('Usuario Duplicado');
    await page.getByLabel('Tu email').fill('existente@lavanderia.com');
    await page.getByLabel('Nombre de tu lavandería').fill('Mi Negocio');
    await page.getByLabel('Crea tu contraseña').fill('PasswordSegura123!');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page.getByText('Error al registrarse')).toBeVisible();
    await expect(page.getByText('El correo electrónico ya se encuentra registrado activamente.')).toBeVisible();
  });
});
