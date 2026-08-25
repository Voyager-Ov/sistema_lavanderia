import { describe, test, expect, beforeAll } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";
import { setupTenantForTest, createClienteFixture } from "../helpers/clientes.helper.js";
import { clientesService } from "../../modules/clientes/services/clientes.service.js";

describe("Módulo Clientes: CRUD, Búsqueda y Aislamiento Multi-Tenant (CU-CLI-01, 03, 04, 05)", () => {
    let tenant1, tenant2;

    beforeAll(async () => {
        tenant1 = await setupTenantForTest({ negocioNombre: "Lavandería Tenant 1" });
        tenant2 = await setupTenantForTest({ negocioNombre: "Lavandería Tenant 2" });
    });

    test("1. [CU-CLI-03] Debe crear un cliente nuevo con CuentaCorriente inicial en saldo 0", async () => {
        const payload = {
            nombre: "Juan Carlos",
            apellido: "Perez",
            telefono: "1122334455",
            email: "juan.perez@lavanderia.test",
            direccion: "Av. San Martín 450"
        };

        const res = await request(app)
            .post("/api/clientes")
            .set("Authorization", `Bearer ${tenant1.token}`)
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.status).toBe("success");
        expect(res.body.data).toBeDefined();
        expect(res.body.data.nombre).toBe("Juan Carlos");
        expect(res.body.data.activo).toBe(true);
        expect(res.body.data.cuentaCorriente).toBeDefined();
        expect(res.body.data.cuentaCorriente.saldo).toBe(0);

        // Verificar en base de datos
        const { Cliente, CuentaCorriente } = tenant1.models;
        const clienteDb = await Cliente.findByPk(res.body.data.id);
        expect(clienteDb).not.toBeNull();
        expect(clienteDb.nombre).toBe("Juan Carlos");

        const ccDb = await CuentaCorriente.findOne({ where: { clienteId: res.body.data.id } });
        expect(ccDb).not.toBeNull();
        expect(parseFloat(ccDb.saldo)).toBe(0);
    });

    test("2. [CU-CLI-03] Debe fallar rápido si falta el nombre del cliente (Fail-Fast)", async () => {
        const payloadSinNombre = {
            apellido: "Gomez",
            telefono: "1199887766"
        };

        const res = await request(app)
            .post("/api/clientes")
            .set("Authorization", `Bearer ${tenant1.token}`)
            .send(payloadSinNombre);

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });

    test("3. [CU-CLI-01] Debe listar clientes paginados del tenant activo", async () => {
        await createClienteFixture(tenant1.negocio.id, { nombre: "Cliente Pagina 1" });
        await createClienteFixture(tenant1.negocio.id, { nombre: "Cliente Pagina 2" });

        const res = await request(app)
            .get("/api/clientes?page=1&limit=10")
            .set("Authorization", `Bearer ${tenant1.token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.items).toBeInstanceOf(Array);
        expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
        expect(res.body.data.meta).toBeDefined();
        expect(res.body.data.meta.totalItems).toBeGreaterThanOrEqual(2);
    });

    test("4. [CU-CLI-01] Debe filtrar clientes por término de búsqueda real (search)", async () => {
        const uniqueSearchName = `Gardel_${Date.now()}`;
        await createClienteFixture(tenant1.negocio.id, { nombre: uniqueSearchName, apellido: "Cantor" });

        const res = await request(app)
            .get(`/api/clientes?search=${uniqueSearchName}`)
            .set("Authorization", `Bearer ${tenant1.token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.items.length).toBe(1);
        expect(res.body.data.items[0].nombre).toBe(uniqueSearchName);
    });

    test("5. [CU-CLI-01] Aislamiento Multi-Tenant: Cliente de Tenant 1 NUNCA es visible en Tenant 2", async () => {
        const uniqueClientT1 = await createClienteFixture(tenant1.negocio.id, { nombre: `ClienteSoloT1_${Date.now()}` });

        // Intentar consultar desde Tenant 2
        const res = await request(app)
            .get(`/api/clientes/${uniqueClientT1.id}`)
            .set("Authorization", `Bearer ${tenant2.token}`);

        expect(res.status).toBe(404);
        expect(res.body.errorCode || res.body.error).toBe("CLIENT_NOT_FOUND");
    });

    test("6. [CU-CLI-04] Debe actualizar datos de un cliente existente", async () => {
        const fixture = await createClienteFixture(tenant1.negocio.id, { nombre: "Original Name", telefono: "1111" });

        const res = await request(app)
            .put(`/api/clientes/${fixture.id}`)
            .set("Authorization", `Bearer ${tenant1.token}`)
            .send({
                nombre: "Updated Name",
                telefono: "99999999",
                direccion: "Nueva Dirección 789"
            });

        expect(res.status).toBe(200);
        expect(res.body.data.nombre).toBe("Updated Name");
        expect(res.body.data.telefono).toBe("99999999");
        expect(res.body.data.direccion).toBe("Nueva Dirección 789");

        // Validar en DB
        const clienteDb = await tenant1.models.Cliente.findByPk(fixture.id);
        expect(clienteDb.nombre).toBe("Updated Name");
        expect(clienteDb.telefono).toBe("99999999");
    });

    test("7. [CU-CLI-05] Debe eliminar un cliente en base de datos", async () => {
        const fixture = await createClienteFixture(tenant1.negocio.id, { nombre: "Para Borrar" });

        const res = await request(app)
            .delete(`/api/clientes/${fixture.id}`)
            .set("Authorization", `Bearer ${tenant1.token}`);

        expect(res.status).toBe(200);

        const clienteDb = await tenant1.models.Cliente.findByPk(fixture.id);
        expect(clienteDb).toBeNull();
    });
});
