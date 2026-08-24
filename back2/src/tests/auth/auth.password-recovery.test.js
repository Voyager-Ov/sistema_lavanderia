import { describe, it, expect, beforeAll, beforeEach } from "@jest/globals";
import bcrypt from "bcryptjs";
import { connectionManager } from "../../models/connectionManager.js";
import { authService, passwordService } from "../../modules/auth/services/auth.service.js";
import { setupEmailMock, emailStore } from "../helpers/email.mock.js";
import { generateUniqueEmail, createTestTenantWithAdmin } from "../helpers/auth.helper.js";

describe("CU-AUTH-06, CU-AUTH-07 & CU-AUTH-08: Recuperación, Restablecimiento y Cambio de Contraseña", () => {
    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();
    });

    beforeEach(() => {
        setupEmailMock();
    });

    it("1. Forgot Password: Debe generar token criptográfico seguro de 32 bytes y despachar email", async () => {
        const email = generateUniqueEmail("forgotuser");
        await createTestTenantWithAdmin({ email });

        const res = await authService.forgotPassword(email);
        expect(res).toBeDefined();
        expect(res.message).toContain("Si el correo ingresado coincide");

        const lastEmail = emailStore.getLastByRecipient(email);
        expect(lastEmail).not.toBeNull();
        expect(lastEmail.type).toBe("RESET_PASSWORD");
        expect(lastEmail.token).toBeDefined();
        expect(lastEmail.token.length).toBe(64); // 32 bytes en formato hex = 64 chars

        const { Usuario } = connectionManager.centralModels;
        const usuarioDb = await Usuario.findByPk(email);
        expect(usuarioDb.tokenConfirmacion).toBe(lastEmail.token);
    });

    it("2. Forgot Password (Anti-Enumeration): Email inexistente retorna el mismo mensaje genérico sin despachar email", async () => {
        const fakeEmail = "nonexistent.attacker.target@fake.domain.com";

        const res = await authService.forgotPassword(fakeEmail);
        expect(res).toBeDefined();
        expect(res.message).toContain("Si el correo ingresado coincide");

        expect(emailStore.hasEmailFor(fakeEmail)).toBe(false);
    });

    it("3. Reset Password: Debe restablecer contraseña con token válido y hashearla con bcrypt", async () => {
        const email = generateUniqueEmail("resetuser");
        await createTestTenantWithAdmin({ email, password: "OldPassword123!" });

        const { Usuario } = connectionManager.centralModels;
        const testToken = "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef";
        await Usuario.update({
            tokenConfirmacion: testToken,
            tokenConfirmacionExpires: new Date(Date.now() + 60 * 60 * 1000)
        }, { where: { email } });

        const res = await authService.resetPassword({
            token: testToken,
            email,
            newPassword: "NewSecurePassword456!"
        });

        expect(res).toBeDefined();
        expect(res.message).toContain("actualizada exitosamente");

        const usuarioActualizado = await Usuario.findByPk(email);
        expect(usuarioActualizado.tokenConfirmacion).toBeNull();
        const isMatch = await bcrypt.compare("NewSecurePassword456!", usuarioActualizado.password);
        expect(isMatch).toBe(true);
    });

    it("4. Reset Password: Debe rechazar tokens expirados", async () => {
        const email = generateUniqueEmail("expiredtoken");
        await createTestTenantWithAdmin({ email });

        const { Usuario } = connectionManager.centralModels;
        const expiredToken = "expired_token_hex_1234567890abcdef";
        await Usuario.update({
            tokenConfirmacion: expiredToken,
            tokenConfirmacionExpires: new Date(Date.now() - 60000)
        }, { where: { email } });

        await expect(authService.resetPassword({
            token: expiredToken,
            email,
            newPassword: "NewPassword123!"
        })).rejects.toThrow("expirado");
    });

    it("5. Reset Password: Debe rechazar contraseñas menores a 6 caracteres", async () => {
        await expect(authService.resetPassword({
            token: "any_token",
            newPassword: "123"
        })).rejects.toThrow("al menos 6 caracteres");
    });

    it("6. Change Password: Debe cambiar la contraseña en sesión activa validando oldPassword", async () => {
        const email = generateUniqueEmail("changeuser");
        await createTestTenantWithAdmin({ email, password: "InitialPassword123!" });

        const res = await authService.changePassword(
            email,
            "InitialPassword123!",
            "BrandNewPassword789!"
        );

        expect(res).toBeDefined();
        expect(res.message).toContain("exitosa");

        const { Usuario } = connectionManager.centralModels;
        const usuarioDb = await Usuario.findByPk(email);
        const match = await bcrypt.compare("BrandNewPassword789!", usuarioDb.password);
        expect(match).toBe(true);
    });

    it("7. Change Password: Debe rechazar cambio si la oldPassword es incorrecta", async () => {
        const email = generateUniqueEmail("wrongoldpass");
        await createTestTenantWithAdmin({ email, password: "InitialPassword123!" });

        await expect(authService.changePassword(
            email,
            "IncorrectOldPassword!",
            "NewPassword123!"
        )).rejects.toThrow("incorrecta");
    });

    it("8. Change Password: Debe rechazar cambio si la cuenta es solo Google OAuth", async () => {
        const email = generateUniqueEmail("googleonlychange");
        await createTestTenantWithAdmin({ email });

        const { Usuario } = connectionManager.centralModels;
        await Usuario.update({ password: null, googleId: "google_98765" }, { where: { email } });

        await expect(authService.changePassword(
            email,
            "AnyPassword",
            "NewPassword123!"
        )).rejects.toThrow("Google OAuth");
    });
});
