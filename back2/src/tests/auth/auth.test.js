import { describe, it, expect, beforeAll } from "@jest/globals";
import jwt from "jsonwebtoken";
import { connectionManager } from "../../models/connectionManager.js";
import { authService } from "../../modules/auth/services/auth.service.js";

describe("Módulo de Autenticación (Auth)", () => {
    const testEmail = "admin.unit@lavanderia.com";
    const testPassword = "PasswordSegura123";
    let tokenConfirmacion = "";

    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();
    });

    it("1. Debe registrar un nuevo administrador y aprovisionar su negocio/tenant", async () => {
        const res = await authService.register({
            email: testEmail,
            password: testPassword,
            usuarioNombre: "Carlos Gómez",
            negocioNombre: "Lavandería Unit Test",
            cuit: "20112223334",
            rol: "ADMIN"
        });

        expect(res).toBeDefined();
        expect(res.tokenConfirmacion).toBeDefined();
        expect(res.usuario.email).toBe(testEmail);
        expect(res.usuario.rol).toBe("ADMIN");

        tokenConfirmacion = res.tokenConfirmacion;
    });

    it("2. Debe denegar el login con 403 antes de verificar el email", async () => {
        await expect(authService.login({ email: testEmail, password: testPassword }))
            .rejects
            .toThrow("Debes verificar tu email antes de ingresar.");
    });

    it("3. Debe verificar el correo electrónico con el código correcto", async () => {
        const res = await authService.verifyEmail({
            email: testEmail,
            code: tokenConfirmacion
        });

        expect(res.message).toContain("verificado");
    });

    it("4. Debe iniciar sesión exitosamente tras la verificación y retornar el JWT", async () => {
        const res = await authService.login({
            email: testEmail,
            password: testPassword
        });

        expect(res.token).toBeDefined();
        expect(res.usuario.email).toBe(testEmail);
        expect(res.usuario.nombre).toBe("Carlos Gómez");
    });

    it("5. Debe iniciar el flujo de olvido de contraseña y guardar el token", async () => {
        const res = await authService.forgotPassword(testEmail);
        expect(res.message).toBeDefined();

        const { Usuario } = connectionManager.centralModels;
        const usuarioDb = await Usuario.findByPk(testEmail);
        expect(usuarioDb.tokenConfirmacion).not.toBeNull();
    });

    it("6. Debe restablecer la contraseña con un token válido", async () => {
        const { Usuario } = connectionManager.centralModels;
        const usuarioDb = await Usuario.findByPk(testEmail);
        const resetToken = usuarioDb.tokenConfirmacion;

        const res = await authService.resetPassword({
            token: resetToken,
            newPassword: "NuevaPassword456"
        });

        expect(res.message).toContain("exitosa");
    });

    it("7. Debe permitir el cambio de contraseña en una sesión activa", async () => {
        const res = await authService.changePassword(
            testEmail,
            "NuevaPassword456",
            "PasswordFinal789"
        );

        expect(res.message).toContain("exitosa");
    });

    it("8. Debe obtener el perfil completo del usuario autenticado", async () => {
        const profile = await authService.getProfile(testEmail);
        expect(profile.usuario.email).toBe(testEmail);
        expect(profile.usuario.nombre).toBe("Carlos Gómez");
    });

    it("9. Debe permitir el inicio de sesión y vinculación con Google OAuth", async () => {
        const mockGoogleToken = jwt.sign(
            { sub: "google_123456789_test", email: testEmail, name: "Carlos Gómez" },
            "test_secret"
        );

        const googleRes = await authService.loginWithGoogle({ token: mockGoogleToken });

        expect(googleRes.token).toBeDefined();
        expect(googleRes.usuario.email).toBe(testEmail);
        expect(googleRes.usuario.googleLinked).toBe(true);

        const { Usuario } = connectionManager.centralModels;
        const usuarioDb = await Usuario.findByPk(testEmail);
        expect(usuarioDb.googleId).toBe("google_123456789_test");
    });
});
