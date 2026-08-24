import { describe, it, expect, beforeAll } from "@jest/globals";
import { connectionManager } from "../../models/connectionManager.js";
import { authService, profileService } from "../../modules/auth/services/auth.service.js";
import { generateUniqueEmail, createTestTenantWithAdmin } from "../helpers/auth.helper.js";

describe("CU-AUTH-09: Perfil de Usuario y Auditoría de Sesión", () => {
    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();
    });

    it("1. Debe obtener el perfil completo del usuario autenticado (/api/auth/me)", async () => {
        const email = generateUniqueEmail("profileuser");
        const tenantData = await createTestTenantWithAdmin({
            email,
            nombre: "Lucía Méndez",
            negocioNombre: "Lavandería Méndez",
            rol: "ADMIN"
        });

        const profile = await profileService.getProfile(email);

        expect(profile).toBeDefined();
        expect(profile.usuario).toBeDefined();
        expect(profile.usuario.email).toBe(email);
        expect(profile.usuario.nombre).toBe("Lucía Méndez");
        expect(profile.usuario.rol).toBe("ADMIN");
        expect(profile.usuario.negocioId).toBe(tenantData.negocio.id);
        expect(profile.usuario.id).toBe(tenantData.empleado.id);
        expect(profile.usuario.googleLinked).toBe(false);
    });

    it("2. Debe fallar con 404 USER_NOT_FOUND si el usuario no existe", async () => {
        await expect(profileService.getProfile("nonexistent@domain.com"))
            .rejects
            .toThrow("no encontrado");
    });

    it("3. Debe registrar auditoría en la tabla Sesion del Tenant tras iniciar sesión", async () => {
        const email = generateUniqueEmail("sessionaudit");
        const password = "PasswordAudit123!";

        const tenantData = await createTestTenantWithAdmin({
            email,
            password,
            nombre: "Esteban Quito",
            negocioNombre: "Lavandería Quito"
        });

        // Iniciar sesión
        await authService.login({ email, password });

        // Validar que en la DB del Tenant exista el registro de Sesion
        const tenantDb = await connectionManager.getTenantDb(tenantData.negocio.id);
        const sesion = await tenantDb.models.Sesion.findOne({
            where: { usuarioEmail: email },
            order: [["id", "DESC"]]
        });

        expect(sesion).not.toBeNull();
        expect(sesion.usuarioEmail).toBe(email);
        expect(sesion.fechaHoraInicio).toBeDefined();
    });
});
