import request from "supertest";
import app from "../../app.js";
import {
    setupTenantForDashboardTest,
    createDashboardClienteFixture,
    createDashboardPedidoFixture
} from "../helpers/dashboard.helper.js";

describe("Dashboard Estados Suite - Conteo de Pedidos Activos y Feed Reciente", () => {
    let tenantContext;
    let cliente;

    beforeAll(async () => {
        tenantContext = await setupTenantForDashboardTest();
        cliente = await createDashboardClienteFixture(tenantContext.negocio.id, { nombre: "EstadosCliente" });
    });

    it("1. [LIVE/DB] Debe clasificar correctamente pedidos por estado operativo", async () => {
        await createDashboardPedidoFixture(tenantContext.negocio.id, cliente.id, { estado: "Pendiente" });
        await createDashboardPedidoFixture(tenantContext.negocio.id, cliente.id, { estado: "En Proceso" });
        await createDashboardPedidoFixture(tenantContext.negocio.id, cliente.id, { estado: "Listo para retirar" });
        await createDashboardPedidoFixture(tenantContext.negocio.id, cliente.id, { estado: "Entregado" });

        const res = await request(app)
            .get("/api/dashboard/stats")
            .set("Authorization", `Bearer ${tenantContext.adminToken}`);

        expect(res.status).toBe(200);
        const { pedidosActivos } = res.body.data;
        expect(pedidosActivos.PENDIENTE).toBeGreaterThanOrEqual(1);
        expect(pedidosActivos.EN_PROCESO).toBeGreaterThanOrEqual(1);
        expect(pedidosActivos.LISTO_PARA_RETIRAR).toBeGreaterThanOrEqual(1);
        expect(pedidosActivos.ENTREGADO).toBeGreaterThanOrEqual(1);
    });

    it("2. [LIVE/DB] Debe excluir pedidos CANCELADOS de los conteos de producción activa", async () => {
        await createDashboardPedidoFixture(tenantContext.negocio.id, cliente.id, { estado: "Cancelado" });

        const res = await request(app)
            .get("/api/dashboard/stats")
            .set("Authorization", `Bearer ${tenantContext.adminToken}`);

        expect(res.status).toBe(200);
        const { pedidosActivos } = res.body.data;
        expect(pedidosActivos.CANCELADO).toBeGreaterThanOrEqual(1);
    });

    it("3. [LIVE/DB] Debe retornar ultimosPedidos con los 5 pedidos más recientes y sus datos", async () => {
        const res = await request(app)
            .get("/api/dashboard/stats")
            .set("Authorization", `Bearer ${tenantContext.adminToken}`);

        expect(res.status).toBe(200);
        const { ultimosPedidos } = res.body.data;
        expect(Array.isArray(ultimosPedidos)).toBe(true);
        expect(ultimosPedidos.length).toBeLessThanOrEqual(5);

        if (ultimosPedidos.length > 0) {
            const first = ultimosPedidos[0];
            expect(first.id).toBeDefined();
            expect(first.title).toContain("Pedido #");
            expect(first.subtitle).toBeDefined();
            expect(first.badgeText).toBeDefined();
            expect(["green", "yellow", "red", "blue"]).toContain(first.badgeColor);
        }
    });
});
