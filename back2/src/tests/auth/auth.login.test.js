import { describe, it, expect, beforeAll, beforeEach } from "@jest/globals";
import jwt from "jsonwebtoken";
import { connectionManager } from "../../models/connectionManager.js";
import { authService, registerService } from "../../modules/auth/services/auth.service.js";
import { setupEmailMock } from "../helpers/email.mock.js";
import {
    generateUniqueEmail,
    createTestTenantWithAdmin,
    createTestUser,
    setupGoogleOAuthMock
} from "../helpers/auth.helper.js";
import { getJwtSecret } from "../../config/env.config.js";

describe("CU-AUTH-02 & CU-AUTH-03: Inicio de Sesión (Local & Google OAuth)", () => {
    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();
    });

    beforeEach(() => {
        setupEmailMock();
        setupGoogleOAuthMock();
    });

    it("1. Debe iniciar sesión exitosamente para un Administrador y emitir JWT con claims de Tenant", async () => {
        const email = generateUniqueEmail("adminlogin");
        const password = "PasswordAdmin123!";

        const tenantData = await createTestTenantWithAdmin({
            email,
            password,
            nombre: "Rodrigo Perez",
            negocioNombre: "Lavandería Rodrigo"
        });

        const res = await authService.login({ email, password });

        expect(res).toBeDefined();
        expect(res.token).toBeDefined();
        expect(res.usuario).toBeDefined();
        expect(res.usuario.email).toBe(email);
        expect(res.usuario.rol).toBe("ADMIN");
        expect(res.usuario.negocioId).toBe(tenantData.negocio.id);
        expect(res.usuario.id).toBe(tenantData.empleado.id);

        // Verificar el payload del JWT firmado
        const decoded = jwt.verify(res.token, getJwtSecret());
        expect(decoded.email).toBe(email);
        expect(decoded.negocioId).toBe(tenantData.negocio.id);
        expect(decoded.empleadoId).toBe(tenantData.empleado.id);
        expect(decoded.rol).toBe("ADMIN");
    });

    it("2. Debe iniciar sesión exitosamente para un SuperAdmin sin requerir tenant", async () => {
        const email = generateUniqueEmail("superadmin");
        const password = "PasswordSuperAdmin123!";

        await createTestUser({
            email,
            password,
            rol: "SUPER_ADMIN",
            emailConfirmado: true
        });

        const res = await authService.login({ email, password });

        expect(res).toBeDefined();
        expect(res.token).toBeDefined();
        expect(res.usuario.email).toBe(email);
        expect(res.usuario.rol).toBe("SUPER_ADMIN");

        const decoded = jwt.verify(res.token, getJwtSecret());
        expect(decoded.email).toBe(email);
        expect(decoded.rol).toBe("SUPER_ADMIN");
    });

    it("3. Debe fallar rápido (Fail-Fast) si falta email o password", async () => {
        await expect(authService.login({ password: "123" }))
            .rejects
            .toThrow("email");

        await expect(authService.login({ email: "test@test.com" }))
            .rejects
            .toThrow("password");
    });

    it("4. Debe rechazar credenciales incorrectas con 401 INVALID_CREDENTIALS", async () => {
        const email = generateUniqueEmail("wrongpass");
        await createTestTenantWithAdmin({ email, password: "CorrectPassword123" });

        await expect(authService.login({ email, password: "WrongPassword999" }))
            .rejects
            .toThrow("Credenciales inválidas");
    });

    it("5. Debe rechazar con 403 REGISTRATION_PENDING si el usuario tiene una solicitud pendiente", async () => {
        const email = generateUniqueEmail("pendinglogin");
        const password = "PasswordPending123";

        await authService.register({
            email,
            password,
            usuarioNombre: "Solicitante Espera",
            negocioNombre: "Lavandería Pendiente"
        });

        await expect(authService.login({ email, password }))
            .rejects
            .toThrow("revisión");
    });

    it("6. Debe rechazar con 403 REGISTRATION_REJECTED si la solicitud fue rechazada con motivo", async () => {
        const email = generateUniqueEmail("rejectedlogin");
        const password = "PasswordRejected123";

        const regRes = await authService.register({
            email,
            password,
            usuarioNombre: "Solicitante Rechazado",
            negocioNombre: "Lavandería Rechazada"
        });

        await registerService.rechazarSolicitudNegocio(regRes.solicitud.id, "Documentación CUIT no verificable");

        await expect(authService.login({ email, password }))
            .rejects
            .toThrow("rechazada");
    });

    it("7. Debe rechazar con 403 USER_DISABLED si la cuenta está desactivada", async () => {
        const email = generateUniqueEmail("disableduser");
        const password = "Password123";

        await createTestTenantWithAdmin({ email, password });
        const { Usuario } = connectionManager.centralModels;
        await Usuario.update({ activo: false }, { where: { email } });

        await expect(authService.login({ email, password }))
            .rejects
            .toThrow("desactivada");
    });

    it("8. Debe rechazar con 400 USE_GOOGLE_OAUTH si la cuenta fue registrada solo con Google", async () => {
        const email = generateUniqueEmail("googleonly");
        await createTestTenantWithAdmin({ email, password: null });
        const { Usuario } = connectionManager.centralModels;
        await Usuario.update({ password: null, googleId: "google_12345" }, { where: { email } });

        await expect(authService.login({ email, password: "AnyPassword" }))
            .rejects
            .toThrow("Google");
    });

    it("9. Debe rechazar con 403 EMAIL_NOT_VERIFIED si el correo no ha sido verificado", async () => {
        const email = generateUniqueEmail("unverified");
        const password = "Password123";

        await createTestTenantWithAdmin({ email, password });
        const { Usuario } = connectionManager.centralModels;
        await Usuario.update({ emailConfirmado: false }, { where: { email } });

        await expect(authService.login({ email, password }))
            .rejects
            .toThrow("verificar tu email");
    });

    it("10. Google OAuth: Debe permitir login con idToken válido y vincular googleId", async () => {
        const email = generateUniqueEmail("googlesuccess");
        await createTestTenantWithAdmin({ email, password: "SomePassword123" });

        const validIdToken = `valid-google-token:${email}`;
        const res = await authService.loginWithGoogle({ idToken: validIdToken });

        expect(res.token).toBeDefined();
        expect(res.usuario.email).toBe(email);
        expect(res.usuario.googleLinked).toBe(true);

        const { Usuario } = connectionManager.centralModels;
        const usuarioDb = await Usuario.findByPk(email);
        expect(usuarioDb.googleId).toBe(`google_id_${email}`);
    });

    it("11. Google OAuth: Debe fallar con 401 INVALID_GOOGLE_TOKEN ante token inválido (Cero Bypass)", async () => {
        await expect(authService.loginWithGoogle({ idToken: "invalid-token" }))
            .rejects
            .toThrow("inválido o caducado");
    });

    it("12. Google OAuth: Debe fallar rápido si no se envía idToken", async () => {
        await expect(authService.loginWithGoogle({}))
            .rejects
            .toThrow("idToken");
    });
});
