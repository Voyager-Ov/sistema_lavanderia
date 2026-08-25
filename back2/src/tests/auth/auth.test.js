import { describe, it, expect, beforeAll, beforeEach, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { connectionManager } from "../../models/connectionManager.js";
import { authService, registerService } from "../../modules/auth/services/auth.service.js";
import { setupGoogleOAuthMock } from "../helpers/auth.helper.js";

jest.setTimeout(30000);

describe("Módulo de Autenticación (Auth)", () => {
    const testEmail = "admin.unit@lavanderia.com";
    const testPassword = "PasswordSegura123";
    let solicitudId = null;

    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();
    });

    beforeEach(() => {
        setupGoogleOAuthMock();
    });

    it("1. Debe registrar una nueva solicitud de negocio", async () => {
        const res = await authService.register({
            email: testEmail,
            password: testPassword,
            usuarioNombre: "Carlos Gómez",
            negocioNombre: "Lavandería Unit Test",
            cuit: "20112223334",
            rol: "ADMIN"
        });

        expect(res).toBeDefined();
        expect(res.solicitud).toBeDefined();
        expect(res.solicitud.email).toBe(testEmail);
        expect(res.solicitud.estado).toBe("PENDIENTE");

        solicitudId = res.solicitud.id;
    });

    it("2. Debe rechazar el login mientras la solicitud esté PENDIENTE", async () => {
        await expect(authService.login({ email: testEmail, password: testPassword }))
            .rejects
            .toThrow("revisión");
    });

    it("3. El SuperAdmin aprueba y sustancializa la solicitud de negocio", async () => {
        const res = await registerService.sustanciarAprobacionNegocio(solicitudId);
        expect(res).toBeDefined();
        expect(res.usuario.email).toBe(testEmail);
        expect(res.usuario.nombre).toBe("Carlos Gómez");
    });

    it("4. Debe iniciar sesión exitosamente tras la aprobación y retornar el JWT", async () => {
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
        const mockGoogleToken = `valid-google-token:${testEmail}`;

        const googleRes = await authService.loginWithGoogle({ idToken: mockGoogleToken });

        expect(googleRes.token).toBeDefined();
        expect(googleRes.usuario.email).toBe(testEmail);
        expect(googleRes.usuario.googleLinked).toBe(true);

        const { Usuario } = connectionManager.centralModels;
        const usuarioDb = await Usuario.findByPk(testEmail);
        expect(usuarioDb.googleId).toBe(`google_id_${testEmail}`);
    });
});
