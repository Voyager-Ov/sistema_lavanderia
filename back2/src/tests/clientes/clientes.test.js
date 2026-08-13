import { describe, it, expect, beforeAll } from "@jest/globals";
import { connectionManager } from "../../models/connectionManager.js";
import { clientesService } from "../../modules/clientes/services/clientes.service.js";

describe("Módulo de Clientes y Cuentas Corrientes", () => {
    const negocioId = 1;
    let clienteId = null;

    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();
    });

    it("1. Debe crear un nuevo cliente", async () => {
        const cliente = await clientesService.crearCliente(negocioId, {
            nombre: "Maria",
            apellido: "Gonzalez",
            telefono: "+541122334455",
            email: "maria.gonzalez@gmail.com",
            direccion: "Calle Falsa 123"
        });

        expect(cliente).toBeDefined();
        expect(cliente.id).toBeDefined();
        expect(cliente.nombre).toBe("Maria");

        clienteId = cliente.id;
    });

    it("2. Debe listar clientes con paginación", async () => {
        const result = await clientesService.listarClientes(negocioId, {
            page: 1,
            limit: 10
        });

        expect(result.items).toBeDefined();
        expect(result.items.length).toBeGreaterThan(0);
        expect(result.meta.totalItems).toBeGreaterThan(0);
    });

    it("3. Debe obtener el detalle de un cliente por ID", async () => {
        const cliente = await clientesService.obtenerClientePorId(negocioId, clienteId);

        expect(cliente).toBeDefined();
        expect(cliente.id).toBe(clienteId);
        expect(cliente.nombre).toBe("Maria");
    });

    it("4. Debe actualizar datos de un cliente", async () => {
        const actualizado = await clientesService.actualizarCliente(negocioId, clienteId, {
            telefono: "+541199887766"
        });

        expect(actualizado.telefono).toBe("+541199887766");
    });

    it("5. Debe eliminar un cliente", async () => {
        const res = await clientesService.eliminarCliente(negocioId, clienteId);
        expect(res.message).toContain("correctamente");
    });
});
