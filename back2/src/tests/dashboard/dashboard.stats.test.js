import request from "supertest";
import app from "../../app.js";
import {
    setupTenantForDashboardTest,
    createDashboardClienteFixture,
    createDashboardPedidoFixture,
    createDashboardMovimientoCajaFixture,
    openDashboardCajaFixture
} from "../helpers/dashboard.helper.js";

describe("Dashboard Stats Suite - Ingresos, Serie 7 Días y Top Clientes", () => {
    let tenantContext;
    let caja;

    beforeAll(async () => {
        tenantContext = await setupTenantForDashboardTest();
        caja = await openDashboardCajaFixture(tenantContext.negocio.id, tenantContext.empleado.id, 10000);
    });

    it("1. [LIVE/DB] Debe calcular ingresos.hoyCobrado e ingresos.ayerCobrado desde MovimientoCaja", async () => {
        const now = new Date();
        const ayer = new Date(now);
        ayer.setDate(ayer.getDate() - 1);

        // Movimiento de hoy ($3.500)
        await createDashboardMovimientoCajaFixture(tenantContext.negocio.id, caja.id, {
            monto: 3500,
            tipoMovimiento: "Ingreso por Venta",
            fechaHora: now
        });

        // Movimiento de ayer ($2.000)
        await createDashboardMovimientoCajaFixture(tenantContext.negocio.id, caja.id, {
            monto: 2000,
            tipoMovimiento: "Ingreso por Venta",
            fechaHora: ayer
        });

        const res = await request(app)
            .get("/api/dashboard/stats")
            .set("Authorization", `Bearer ${tenantContext.adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data.ingresos).toBeDefined();
        expect(res.body.data.ingresos.hoyCobrado).toBeGreaterThanOrEqual(3500);
        expect(res.body.data.ingresos.ayerCobrado).toBeGreaterThanOrEqual(2000);
    });

    it("2. [LIVE/DB] Debe generar exactamente 7 elementos en ventasPorDia ordenados cronológicamente", async () => {
        const res = await request(app)
            .get("/api/dashboard/stats")
            .set("Authorization", `Bearer ${tenantContext.adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.ventasPorDia)).toBe(true);
        expect(res.body.data.ventasPorDia).toHaveLength(7);

        const diasValidos = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
        res.body.data.ventasPorDia.forEach(item => {
            expect(diasValidos).toContain(item.name);
            expect(typeof item.ventas).toBe("number");
        });
    });

    it("3. [LIVE/DB] Debe agrupar y ordenar topClientes por volumen de pedidos de forma descendente", async () => {
        const clienteTop = await createDashboardClienteFixture(tenantContext.negocio.id, { nombre: "ClienteVIP" });
        const clienteSecundario = await createDashboardClienteFixture(tenantContext.negocio.id, { nombre: "ClienteFrecuente" });

        // 3 pedidos para clienteTop
        await createDashboardPedidoFixture(tenantContext.negocio.id, clienteTop.id);
        await createDashboardPedidoFixture(tenantContext.negocio.id, clienteTop.id);
        await createDashboardPedidoFixture(tenantContext.negocio.id, clienteTop.id);

        // 1 pedido para clienteSecundario
        await createDashboardPedidoFixture(tenantContext.negocio.id, clienteSecundario.id);

        const res = await request(app)
            .get("/api/dashboard/stats")
            .set("Authorization", `Bearer ${tenantContext.adminToken}`);

        expect(res.status).toBe(200);
        const { topClientes } = res.body.data;
        expect(Array.isArray(topClientes)).toBe(true);
        expect(topClientes.length).toBeGreaterThanOrEqual(2);

        // Verificar que el primero sea clienteTop con 3 pedidos
        const first = topClientes[0];
        expect(first.nombre).toContain("ClienteVIP");
        expect(first.pedidos).toBeGreaterThanOrEqual(3);
    });

    it("4. [LIVE/DB] Debe responder con ceros limpios ante un tenant nuevo sin datos", async () => {
        const newTenant = await setupTenantForDashboardTest();

        const res = await request(app)
            .get("/api/dashboard/stats")
            .set("Authorization", `Bearer ${newTenant.adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.data.ingresos.hoyCobrado).toBe(0);
        expect(res.body.data.ingresos.ayerCobrado).toBe(0);
        expect(res.body.data.pedidosDelDia.hoy).toBe(0);
        expect(res.body.data.topClientes).toEqual([]);
    });
});
