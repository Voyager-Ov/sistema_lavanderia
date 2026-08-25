import { describe, test, expect, beforeAll } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";
import { setupTenantForTest, createClienteFixture } from "../helpers/clientes.helper.js";

describe("Módulo Clientes: Estado de Cuenta Corriente y Ajuste Manual de Crédito (CU-CLI-08)", () => {
    let tenant;

    beforeAll(async () => {
        tenant = await setupTenantForTest({ negocioNombre: "Lavandería Cuenta Corriente Test" });
    });

    test("1. [CU-CLI-08] Debe registrar ajuste de crédito manual y crear MovimientoCuenta en DB", async () => {
        const { id: clienteId } = await createClienteFixture(tenant.negocio.id, { saldoInicial: 100 });

        const res = await request(app)
            .post(`/api/clientes/${clienteId}/cuenta-corriente/ajuste-credito`)
            .set("Authorization", `Bearer ${tenant.token}`)
            .send({
                monto: 2500,
                concepto: "Compensación por prenda dañada"
            });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
        expect(res.body.data.resumen.saldoAFavor).toBe(2600);

        // Validar en base de datos
        const { CuentaCorriente, MovimientoCuenta } = tenant.models;
        const ccDb = await CuentaCorriente.findOne({ where: { clienteId } });
        expect(parseFloat(ccDb.saldo)).toBe(2600);

        const movDb = await MovimientoCuenta.findOne({
            where: { cuentaCorrienteId: ccDb.id },
            order: [["id", "DESC"]]
        });
        expect(movDb).not.toBeNull();
        expect(parseFloat(movDb.monto)).toBe(2500);
        expect(movDb.descripcion).toBe("Compensación por prenda dañada");
        expect(movDb.tipoMovimiento).toBe("Crédito");
    });

    test("2. [CU-CLI-08] Debe fallar rápido si falta el monto (Fail-Fast)", async () => {
        const { id: clienteId } = await createClienteFixture(tenant.negocio.id);

        const res = await request(app)
            .post(`/api/clientes/${clienteId}/cuenta-corriente/ajuste-credito`)
            .set("Authorization", `Bearer ${tenant.token}`)
            .send({
                concepto: "Sin monto"
            });

        expect(res.status).toBe(400);
        expect(res.body.errorCode || res.body.error).toBe("MISSING_AMOUNT");
    });

    test("3. [CU-CLI-08] Debe fallar si el monto es <= 0 o no numérico", async () => {
        const { id: clienteId } = await createClienteFixture(tenant.negocio.id);

        const res = await request(app)
            .post(`/api/clientes/${clienteId}/cuenta-corriente/ajuste-credito`)
            .set("Authorization", `Bearer ${tenant.token}`)
            .send({
                monto: -100,
                concepto: "Monto negativo"
            });

        expect(res.status).toBe(400);
        expect(res.body.errorCode || res.body.error).toBe("INVALID_AMOUNT");
    });

    test("4. [CU-CLI-08] Debe fallar rápido si falta el concepto (Fail-Fast sin fallbacks silenciosos)", async () => {
        const { id: clienteId } = await createClienteFixture(tenant.negocio.id);

        const res = await request(app)
            .post(`/api/clientes/${clienteId}/cuenta-corriente/ajuste-credito`)
            .set("Authorization", `Bearer ${tenant.token}`)
            .send({
                monto: 1000,
                concepto: "   "
            });

        expect(res.status).toBe(400);
        expect(res.body.errorCode || res.body.error).toBe("MISSING_CONCEPT");
    });

    test("5. [CU-CLI-08] Debe obtener el estado de cuenta y movimientos del cliente", async () => {
        const { id: clienteId } = await createClienteFixture(tenant.negocio.id, { saldoInicial: 500 });

        const res = await request(app)
            .get(`/api/clientes/${clienteId}/cuenta-corriente/estado-cuenta`)
            .set("Authorization", `Bearer ${tenant.token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.cliente.id).toBe(clienteId);
        expect(res.body.data.resumen).toBeDefined();
        expect(res.body.data.resumen.saldoAFavor).toBe(500);
    });
});
