import request from "supertest";
import app from "../../app.js";
import {
    setupTenantForDashboardTest,
    createDashboardMovimientoCajaFixture,
    openDashboardCajaFixture
} from "../helpers/dashboard.helper.js";

describe("Dashboard Isolation & Security Suite - Multi-Tenant y Control de Acceso", () => {
    let tenantA;
    let tenantB;

    beforeAll(async () => {
        tenantA = await setupTenantForDashboardTest();
        tenantB = await setupTenantForDashboardTest();

        const cajaA = await openDashboardCajaFixture(tenantA.negocio.id, tenantA.empleado.id, 5000);
        // Registrar $15.000 en ventas para Tenant A
        await createDashboardMovimientoCajaFixture(tenantA.negocio.id, cajaA.id, {
            monto: 15000,
            tipoMovimiento: "Ingreso por Venta"
        });
    });

    it("1. [LIVE/DB] Las ventas del Tenant A no deben aparecer en el dashboard del Tenant B", async () => {
        // Tenant A debe reflejar $15.000
        const resA = await request(app)
            .get("/api/dashboard/stats")
            .set("Authorization", `Bearer ${tenantA.adminToken}`);

        expect(resA.status).toBe(200);
        expect(resA.body.data.ingresos.hoyCobrado).toBeGreaterThanOrEqual(15000);

        // Tenant B debe reflejar $0
        const resB = await request(app)
            .get("/api/dashboard/stats")
            .set("Authorization", `Bearer ${tenantB.adminToken}`);

        expect(resB.status).toBe(200);
        expect(resB.body.data.ingresos.hoyCobrado).toBe(0);
    });

    it("2. [SECURITY] Debe rechazar la petición con 401 si no se envía token de autenticación", async () => {
        const res = await request(app).get("/api/dashboard/stats");
        expect(res.status).toBe(401);
    });

    it("3. [SECURITY] Debe rechazar con 401 si el token no contiene negocioId", async () => {
        const jwt = (await import("jsonwebtoken")).default;
        const { getJwtSecret } = await import("../../config/env.config.js");
        
        const tokenSinNegocio = jwt.sign(
            { email: "sin_negocio@test.com", empleadoId: 1, rol: "ADMIN" },
            getJwtSecret(),
            { expiresIn: "1h" }
        );

        const res = await request(app)
            .get("/api/dashboard/stats")
            .set("Authorization", `Bearer ${tokenSinNegocio}`);

        expect(res.status).toBe(401);
    });
});
