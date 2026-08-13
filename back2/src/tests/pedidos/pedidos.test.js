import { describe, it, expect, beforeAll } from "@jest/globals";
import { connectionManager } from "../../models/connectionManager.js";
import { pedidosService } from "../../modules/pedidos/services/pedidos.service.js";
import { serviciosService } from "../../modules/servicios/services/servicios.service.js";

describe("Módulo de Pedidos y Trazabilidad de Estados", () => {
    const negocioId = 1;
    let servicioId = null;
    let numeroPedido = null;

    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();

        // Crear servicio base para pruebas
        const cat = await serviciosService.crearCategoria(negocioId, { nombre: "Lavado Test Pedidos" });
        const srv = await serviciosService.crearServicio(negocioId, {
            nombre: "Lavado Camisas Test",
            precioActual: 4500.00,
            categoriaId: cat.id
        });
        servicioId = srv.id;
    });

    it("1. Debe crear un nuevo pedido con cliente e ítems", async () => {
        const pedido = await pedidosService.crearPedido(negocioId, {
            clienteNombre: "Juan Perez Test",
            clienteTelefono: "+541155667788",
            origen: "MOSTRADOR",
            observaciones: "Dejar en bolsa plástica",
            costoEnvio: 500.00,
            detalles: [
                { servicioId, cantidad: 2, precio: 4500.00 }
            ]
        });

        expect(pedido).toBeDefined();
        expect(pedido.numeroPedido).toBeDefined();
        expect(pedido.total).toBe(9500.00); // (4500 * 2) + 500
        expect(pedido.estadoActual).toBe("PENDIENTE");

        numeroPedido = pedido.numeroPedido;
    });

    it("2. Debe listar pedidos con paginación", async () => {
        const result = await pedidosService.listarPedidos(negocioId, {
            page: 1,
            limit: 10
        });

        expect(result.items).toBeDefined();
        expect(result.items.length).toBeGreaterThan(0);
        expect(result.meta.totalItems).toBeGreaterThan(0);
    });

    it("3. Debe obtener el detalle de un pedido por número", async () => {
        const pedido = await pedidosService.obtenerPedidoPorNumero(negocioId, numeroPedido);

        expect(pedido).toBeDefined();
        expect(pedido.numeroPedido).toBe(numeroPedido);
        expect(pedido.detalles.length).toBe(1);
    });

    it("4. Debe avanzar la trazabilidad del estado del pedido a EN_PROCESO", async () => {
        const actualizado = await pedidosService.cambiarEstado(negocioId, numeroPedido, "EN_PROCESO");

        expect(actualizado.estadoActual).toBe("EN_PROCESO");
        expect(actualizado.cambiosEstado.length).toBe(2);
    });

    it("5. Debe avanzar la trazabilidad del estado del pedido a LISTO", async () => {
        const actualizado = await pedidosService.cambiarEstado(negocioId, numeroPedido, "LISTO");

        expect(actualizado.estadoActual).toBe("LISTO");
    });

    it("6. Debe calcular las estadísticas del módulo de pedidos", async () => {
        const stats = await pedidosService.obtenerEstadisticas(negocioId);

        expect(stats).toBeDefined();
        expect(stats.total).toBeGreaterThan(0);
        expect(stats.listos).toBeGreaterThan(0);
    });

    it("7. Debe marcar el ticket del pedido como impreso", async () => {
        const res = await pedidosService.marcarTicketImpreso(negocioId, numeroPedido);
        expect(res.message).toContain("impreso");

        const pedido = await pedidosService.obtenerPedidoPorNumero(negocioId, numeroPedido);
        expect(pedido.ticketImpreso).toBe(true);
    });
});
