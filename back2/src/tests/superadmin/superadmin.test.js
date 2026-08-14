import { describe, it, expect, beforeAll } from "@jest/globals";
import bcrypt from "bcryptjs";
import { connectionManager } from "../../models/connectionManager.js";
import { superAdminService } from "../../modules/superadmin/services/superadmin.service.js";
import { verificarSuscripcionActiva } from "../../middlewares/superadmin.middleware.js";

describe("Módulo de Administración Global (SuperAdmin)", () => {
    const adminEmail = "superadmin.test@sistema.com";
    const adminPassword = "SuperSecretPassword123!";

    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();

        const SuperAdmin = connectionManager.centralModels.SuperAdmin;
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await SuperAdmin.create({
            email: adminEmail,
            passwordHash,
            nombre: "Test SuperAdmin",
            activo: true
        });

        const Negocio = connectionManager.centralModels.Negocio;
        await Negocio.create({
            id: 999,
            nombre: "Lavandería Test SuperAdmin",
            subdominio: "test-superadmin",
            activo: true,
            estadoSuscripcion: "ACTIVA"
        });
    });

    it("1. Debe autenticar correctamente al SuperAdmin con credenciales válidas", async () => {
        const res = await superAdminService.login(adminEmail, adminPassword);
        expect(res).toBeDefined();
        expect(res.token).toBeDefined();
        expect(res.user.email).toBe(adminEmail);
        expect(res.user.rol).toBe("SUPERADMIN_SYS");
    });

    it("2. Debe rechazar el login con contraseña incorrecta", async () => {
        await expect(superAdminService.login(adminEmail, "wrongpassword"))
            .rejects
            .toThrow("Credenciales inválidas");
    });

    it("3. Debe obtener el dashboard con métricas de negocios", async () => {
        const dashboard = await superAdminService.getDashboard();
        expect(dashboard.negocios).toBeDefined();
        expect(dashboard.stats).toBeDefined();
        expect(dashboard.stats.totalNegocios).toBeGreaterThanOrEqual(1);
    });

    it("4. Debe ejecutar el chequeo de salud del sistema", async () => {
        const health = await superAdminService.runHealthCheck();
        expect(health.status).toBeDefined();
        expect(health.database).toBe("UP");
    });

    it("5. Debe permitir cortar y reactivar el servicio de un negocio", async () => {
        const negocioSuspendido = await superAdminService.toggleEstadoNegocio(999, false);
        expect(negocioSuspendido.activo).toBe(false);
        expect(negocioSuspendido.estadoSuscripcion).toBe("SUSPENDIDA");

        const negocioReactivado = await superAdminService.toggleEstadoNegocio(999, true);
        expect(negocioReactivado.activo).toBe(true);
        expect(negocioReactivado.estadoSuscripcion).toBe("ACTIVA");
    });

    it("6. El middleware de suscripción debe rechazar peticiones si el negocio está suspendido", async () => {
        await superAdminService.toggleEstadoNegocio(999, false);

        const req = { user: { negocioId: 999 } };
        const res = {};
        let nextCalledWithError = null;

        await verificarSuscripcionActiva(req, res, (err) => {
            nextCalledWithError = err;
        });

        expect(nextCalledWithError).toBeDefined();
        expect(nextCalledWithError.statusCode).toBe(403);
        expect(nextCalledWithError.message).toContain("suspendido");
    });
});
