import { describe, test, expect, beforeAll } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";
import {
    setupTenantForTest,
    createClienteFixture,
    createPedidoFixture,
    openCajaFixture,
    closeCajaFixture
} from "../helpers/clientes.helper.js";

describe("Módulo Clientes: Cobro de Pedidos y Validación de Caja Abierta (CU-CLI-07)", () => {
    let tenant;

    beforeAll(async () => {
        tenant = await setupTenantForTest({ negocioNombre: "Lavandería Cobros Test" });
    });

    test("1. [CU-CLI-07] Debe rechazar el cobro si la caja se encuentra CERRADA", async () => {
        const { id: clienteId } = await createClienteFixture(tenant.negocio.id);
        const pedido = await createPedidoFixture(tenant.negocio.id, clienteId, {
            numeroPedido: 800001,
            total: 1000,
            estado: "Entregado",
            cobrado: false
        });

        // Aseguramos que no haya caja abierta
        await closeCajaFixture(tenant.negocio.id, tenant.empleado.id);

        const res = await request(app)
            .post(`/api/clientes/${clienteId}/cobrar-pedidos`)
            .set("Authorization", `Bearer ${tenant.token}`)
            .send({
                pedidosIds: [pedido.numeroPedido || pedido.id],
                montoRecibido: 1000
            });

        expect(res.status).toBe(400);
        expect(res.body.errorCode || res.body.error).toBe("NO_OPEN_CASH_REGISTER");
    });

    test("2. [CU-CLI-07] Debe cobrar pedido en efectivo y acreditar vuelto en CuentaCorriente si dejarVueltoAFavor=true", async () => {
        const { id: clienteId } = await createClienteFixture(tenant.negocio.id, { saldoInicial: 0 });
        const pedido = await createPedidoFixture(tenant.negocio.id, clienteId, {
            numeroPedido: 800002,
            total: 1000,
            estado: "Entregado",
            cobrado: false
        });

        // Abrimos caja
        await openCajaFixture(tenant.negocio.id, tenant.empleado.id);

        const res = await request(app)
            .post(`/api/clientes/${clienteId}/cobrar-pedidos`)
            .set("Authorization", `Bearer ${tenant.token}`)
            .send({
                pedidosIds: [pedido.numeroPedido || pedido.id],
                montoRecibido: 1500,
                dejarVueltoAFavor: true
            });

        expect(res.status).toBe(200);
        expect(res.body.data.pedidosCobradosCount).toBe(1);
        expect(res.body.data.totalMontoCobrado).toBe(1000);

        // Validar en DB
        const { Pedido, CuentaCorriente, MovimientoCaja } = tenant.models;
        const pedidoDb = await Pedido.findOne({ where: { numeroPedido: pedido.numeroPedido } });
        expect(pedidoDb.cobrado).toBe(true);

        const ccDb = await CuentaCorriente.findOne({ where: { clienteId } });
        expect(parseFloat(ccDb.saldo)).toBe(500);

        // Movimiento de caja registrado por el ingreso por venta
        const movCaja = await MovimientoCaja.findOne({
            order: [["id", "DESC"]]
        });
        expect(movCaja).not.toBeNull();
        expect(parseFloat(movCaja.monto)).toBe(1000);
    });

    test("3. [CU-CLI-07] Debe consumir atómicamente saldo a favor existente al aplicarSaldoAFavor=true", async () => {
        const { id: clienteId } = await createClienteFixture(tenant.negocio.id, { saldoInicial: 400 });
        const pedido = await createPedidoFixture(tenant.negocio.id, clienteId, {
            numeroPedido: 800003,
            total: 1000,
            estado: "Entregado",
            cobrado: false
        });

        await openCajaFixture(tenant.negocio.id, tenant.empleado.id);

        const res = await request(app)
            .post(`/api/clientes/${clienteId}/cobrar-pedidos`)
            .set("Authorization", `Bearer ${tenant.token}`)
            .send({
                pedidosIds: [pedido.numeroPedido || pedido.id],
                aplicarSaldoAFavor: true,
                montoRecibido: 600
            });

        expect(res.status).toBe(200);
        expect(res.body.data.creditoConsumidoTotal).toBe(400);

        // Validar que el saldo a favor quedó en 0 en DB
        const { CuentaCorriente } = tenant.models;
        const ccDb = await CuentaCorriente.findOne({ where: { clienteId } });
        expect(parseFloat(ccDb.saldo)).toBe(0);
    });

    test("4. [CU-CLI-07] Debe rechazar el cobro si el pedido ya fue cobrado previamente", async () => {
        const { id: clienteId } = await createClienteFixture(tenant.negocio.id);
        const pedido = await createPedidoFixture(tenant.negocio.id, clienteId, {
            numeroPedido: 800004,
            total: 500,
            estado: "Entregado",
            cobrado: true
        });

        await openCajaFixture(tenant.negocio.id, tenant.empleado.id);

        const res = await request(app)
            .post(`/api/clientes/${clienteId}/cobrar-pedidos`)
            .set("Authorization", `Bearer ${tenant.token}`)
            .send({
                pedidosIds: [pedido.numeroPedido || pedido.id]
            });

        expect(res.status).toBe(400);
        expect(res.body.errorCode || res.body.error).toBe("ORDER_ALREADY_PAID");
    });
});
