import { describe, it, expect, beforeAll, beforeEach } from "@jest/globals";
import { connectionManager } from "../../models/connectionManager.js";
import { authService, verifyEmailService } from "../../modules/auth/services/auth.service.js";
import { setupEmailMock, emailStore } from "../helpers/email.mock.js";
import { generateUniqueEmail, createTestTenantWithAdmin } from "../helpers/auth.helper.js";

describe("CU-AUTH-04 & CU-AUTH-05: Verificación y Reenvío de Código de Correo", () => {
    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();
    });

    beforeEach(() => {
        setupEmailMock();
    });

    it("1. Debe reenviar un código de verificación de 6 dígitos y despachar correo", async () => {
        const email = generateUniqueEmail("verifytest");
        await createTestTenantWithAdmin({ email });

        // Marcar como no verificado
        const { Usuario } = connectionManager.centralModels;
        await Usuario.update({ emailConfirmado: false, tokenConfirmacion: null }, { where: { email } });

        const res = await authService.resendVerification(email);
        expect(res).toBeDefined();
        expect(res.message).toContain("exitosamente");

        const lastEmail = emailStore.getLastByRecipient(email);
        expect(lastEmail).not.toBeNull();
        expect(lastEmail.type).toBe("VERIFY_CODE");
        expect(lastEmail.codigo).toBeDefined();
        expect(lastEmail.codigo.length).toBe(6);

        const usuarioDb = await Usuario.findByPk(email);
        expect(usuarioDb.tokenConfirmacion).toBe(lastEmail.codigo);
    });

    it("2. Debe verificar el correo exitosamente con el código de 6 dígitos generado", async () => {
        const email = generateUniqueEmail("verifyok");
        await createTestTenantWithAdmin({ email });

        const { Usuario } = connectionManager.centralModels;
        await Usuario.update({
            emailConfirmado: false,
            tokenConfirmacion: "654321",
            tokenConfirmacionExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }, { where: { email } });

        const res = await authService.verifyEmail({ email, code: "654321" });
        expect(res).toBeDefined();
        expect(res.message).toContain("verificado exitosamente");

        const usuarioDb = await Usuario.findByPk(email);
        expect(usuarioDb.emailConfirmado).toBe(true);
        expect(usuarioDb.tokenConfirmacion).toBeNull();
    });

    it("3. Debe ser idempotente si el correo ya fue verificado previamente", async () => {
        const email = generateUniqueEmail("alreadyver");
        await createTestTenantWithAdmin({ email });

        const res = await authService.verifyEmail({ email, code: "123456" });
        expect(res.message).toContain("ya fue verificado previamente");
    });

    it("4. Debe rechazar la verificación ante un código incorrecto", async () => {
        const email = generateUniqueEmail("wrongcode");
        await createTestTenantWithAdmin({ email });

        const { Usuario } = connectionManager.centralModels;
        await Usuario.update({
            emailConfirmado: false,
            tokenConfirmacion: "111222",
            tokenConfirmacionExpires: new Date(Date.now() + 60000)
        }, { where: { email } });

        await expect(authService.verifyEmail({ email, code: "999888" }))
            .rejects
            .toThrow("incorrecto");
    });

    it("5. Debe rechazar la verificación ante un código expirado", async () => {
        const email = generateUniqueEmail("expiredcode");
        await createTestTenantWithAdmin({ email });

        const { Usuario } = connectionManager.centralModels;
        await Usuario.update({
            emailConfirmado: false,
            tokenConfirmacion: "555666",
            tokenConfirmacionExpires: new Date(Date.now() - 10000) // Expirado hace 10s
        }, { where: { email } });

        await expect(authService.verifyEmail({ email, code: "555666" }))
            .rejects
            .toThrow("expirado");
    });

    it("6. Debe rechazar el reenvío de código si la cuenta ya está verificada", async () => {
        const email = generateUniqueEmail("resendverified");
        await createTestTenantWithAdmin({ email });

        await expect(authService.resendVerification(email))
            .rejects
            .toThrow("ya está verificado");
    });

    it("7. Debe fallar rápido si falta email o código en verifyEmail", async () => {
        await expect(authService.verifyEmail({ code: "123456" }))
            .rejects
            .toThrow("correo electrónico");

        await expect(authService.verifyEmail({ email: "test@test.com" }))
            .rejects
            .toThrow("código de verificación");
    });
});
