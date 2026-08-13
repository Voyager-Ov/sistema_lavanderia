import { describe, it, expect, beforeAll } from "@jest/globals";
import { connectionManager } from "../../models/connectionManager.js";
import { pedidosService } from "../../modules/pedidos/services/pedidos.service.js";
import { trazabilidadService } from "../../modules/pedidos/services/trazabilidad.service.js";
import { facturacionService } from "../../modules/pedidos/services/facturacion.service.js";
import { ticketService } from "../../modules/pedidos/services/ticket.service.js";
import { trackingService } from "../../modules/pedidos/services/tracking.service.js";
import { cancelacionService } from "../../modules/pedidos/services/cancelacion.service.js";
import { serviciosService } from "../../modules/servicios/services/servicios.service.js";
import { categoriasService } from "../../modules/servicios/services/categorias.service.js";

describe("Módulo de Pedidos y Trazabilidad de Estados", () => {
    const negocioId = 1;
    let servicioId = null;
    let numeroPedido = null;

    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();

        // Crear servicio base para pruebas
        const cat = await categoriasService.crearCategoria(negocioId, { nombre: "Lavado Test Pedidos" });
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
        await trazabilidadService.cambiarEstado(negocioId, numeroPedido, "EN_PROCESO");
        const actualizado = await pedidosService.obtenerPedidoPorNumero(negocioId, numeroPedido);

        expect(actualizado.estadoActual).toBe("EN_PROCESO");
        expect(actualizado.cambiosEstado.length).toBe(2);
    });

    it("5. Debe avanzar la trazabilidad del estado del pedido a LISTO", async () => {
        await trazabilidadService.cambiarEstado(negocioId, numeroPedido, "LISTO");
        const actualizado = await pedidosService.obtenerPedidoPorNumero(negocioId, numeroPedido);

        expect(actualizado.estadoActual).toBe("LISTO");
    });

    it("6. Debe generar la plantilla HTML del ticket térmico de 80mm", async () => {
        const html = await ticketService.obtenerTicketHTML(negocioId, numeroPedido);
        expect(html).toContain("COMPROBANTE DE PEDIDO");
        expect(html).toContain("Lavado Camisas Test");
    });

    it("7. Debe generar etiquetas de prendas (sub-tickets)", async () => {
        const tickets = await ticketService.generarTicketsPrenda(negocioId, numeroPedido, 2);
        expect(tickets.length).toBe(2);
        expect(tickets[0].codigo).toContain(`TAG-${numeroPedido}`);
    });

    it("8. Debe generar una factura AFIP/ARCA vinculada", async () => {
        const result = await facturacionService.generarFactura(negocioId, numeroPedido);
        expect(result.cae).toBeDefined();
        expect(result.nroComprobante).toBeDefined();
    });

    it("9. Debe devolver la información pública de seguimiento para el cliente (Tracking QR)", async () => {
        const info = await trackingService.obtenerTrackingPublico(negocioId, `LAV-${numeroPedido}`);
        expect(info.ticketCodigo).toBe(`LAV-${numeroPedido}`);
        expect(info.items.length).toBeGreaterThan(0);
        expect(info.estado).toBe("LISTO");
    });

    it("10. Debe calcular las estadísticas del módulo de pedidos", async () => {
        const stats = await pedidosService.obtenerEstadisticas(negocioId);

        expect(stats).toBeDefined();
        expect(stats.total).toBeGreaterThan(0);
        expect(stats.listos).toBeGreaterThan(0);
    });

    it("11. Debe marcar el ticket del pedido como impreso", async () => {
        const res = await trazabilidadService.marcarTicketImpreso(negocioId, numeroPedido);
        expect(res.message).toContain("impreso");

        const pedido = await pedidosService.obtenerPedidoPorNumero(negocioId, numeroPedido);
        expect(pedido.ticketImpreso).toBe(true);
    });

    it("12. Debe procesar la cancelación del pedido con motivo y devolución", async () => {
        const res = await cancelacionService.cancelarPedido(negocioId, numeroPedido, {
            motivoCancelacion: "Prenda no apta para lavado seco",
            descripcionCancelacion: "Cliente solicitó cancelar antes de procesar",
            accionDinero: "DEVOLVER"
        });

        expect(res.message).toContain("cancelado correctamente");
        const cancelado = await pedidosService.obtenerPedidoPorNumero(negocioId, numeroPedido);
        expect(cancelado.estadoActual).toBe("CANCELADO");
    });
});
