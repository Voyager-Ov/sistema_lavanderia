import { describe, test, expect, beforeAll } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";
import { setupTenantForTest, createClienteFixture, createPedidoFixture } from "../helpers/clientes.helper.js";

describe("Módulo Clientes: Regla de Deuda Única y Desglose Financiero (CU-CLI-02, CU-CLI-06)", () => {
    let tenant;

    beforeAll(async () => {
        tenant = await setupTenantForTest({ negocioNombre: "Lavandería Deuda Test" });
    });

    test("1. [CU-CLI-02] Debe computar como Deuda Exigible ÚNICAMENTE los pedidos ENTREGADO impagos", async () => {
        const { id: clienteId } = await createClienteFixture(tenant.negocio.id, { nombre: "Cliente Con Deuda" });

        // 1 pedido ENTREGADO impago ($1500) -> Deuda Exigible
        await createPedidoFixture(tenant.negocio.id, clienteId, {
            total: 1500,
            estado: "Entregado",
            cobrado: false
        });

        // 1 pedido EN_LAVADO impago ($700) -> Monto en Taller (NO es deuda exigible)
        await createPedidoFixture(tenant.negocio.id, clienteId, {
            total: 700,
            estado: "En_Lavado",
            cobrado: false
        });

        // 1 pedido ENTREGADO ya cobrado ($2000) -> Ya no es deuda
        await createPedidoFixture(tenant.negocio.id, clienteId, {
            total: 2000,
            estado: "Entregado",
            cobrado: true
        });

        const res = await request(app)
            .get(`/api/clientes/${clienteId}`)
            .set("Authorization", `Bearer ${tenant.token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.saldoDeuda).toBe(1500);
        expect(res.body.data.montoEnTaller).toBe(700);
        expect(res.body.data.pedidosImpagosCount).toBe(1);
    });

    test("2. [CU-CLI-06] No debe computar pedidos CANCELADOS en pedidos impagos ni en deuda", async () => {
        const { id: clienteId } = await createClienteFixture(tenant.negocio.id, { nombre: "Cliente Con Cancelados" });

        // Pedido cancelado
        await createPedidoFixture(tenant.negocio.id, clienteId, {
            total: 3000,
            estado: "Cancelado",
            cobrado: false
        });

        const res = await request(app)
            .get(`/api/clientes/${clienteId}/pedidos-impagos`)
            .set("Authorization", `Bearer ${tenant.token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.totalDeuda).toBe(0);
        expect(res.body.data.pedidosImpagos.length).toBe(0);
    });

    test("3. [CU-CLI-06] Debe listar pedidos impagos marcando esDeuda=true solo en entregados", async () => {
        const { id: clienteId } = await createClienteFixture(tenant.negocio.id, { nombre: "Cliente Mix Impagos" });

        await createPedidoFixture(tenant.negocio.id, clienteId, {
            numeroPedido: 900001,
            total: 1000,
            estado: "Entregado",
            cobrado: false
        });

        await createPedidoFixture(tenant.negocio.id, clienteId, {
            numeroPedido: 900002,
            total: 800,
            estado: "En_Proceso",
            cobrado: false
        });

        const res = await request(app)
            .get(`/api/clientes/${clienteId}/pedidos-impagos`)
            .set("Authorization", `Bearer ${tenant.token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.totalDeuda).toBe(1000);
        expect(res.body.data.totalImpagos).toBe(1800);
        expect(res.body.data.pedidosImpagos.length).toBe(2);

        const pedidoEntregado = res.body.data.pedidosImpagos.find(p => p.numeroPedido === 900001);
        const pedidoProceso = res.body.data.pedidosImpagos.find(p => p.numeroPedido === 900002);

        expect(pedidoEntregado.esDeuda).toBe(true);
        expect(pedidoProceso.esDeuda).toBe(false);
    });
});
