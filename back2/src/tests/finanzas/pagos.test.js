import { describe, it, expect, beforeAll } from "@jest/globals";
import { connectionManager } from "../../models/connectionManager.js";
import { pagosService } from "../../modules/finanzas/services/pagos.service.js";
import { pedidosService } from "../../modules/pedidos/services/pedidos.service.js";
import { clientesService } from "../../modules/clientes/services/clientes.service.js";
import { serviciosService } from "../../modules/servicios/services/servicios.service.js";
import { categoriasService } from "../../modules/servicios/services/categorias.service.js";

describe("Módulo de Pagos y Métodos de Pago", () => {
    const negocioId = 1;
    let metodoId = null;
    let clienteId = null;
    let servicioId = null;
    let pedidoId = null;

    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();

        // Crear cliente y servicio para el test de pago
        const cliente = await clientesService.crearCliente(negocioId, { nombre: "Cliente Pago" });
        clienteId = cliente.id;

        const cat = await categoriasService.crearCategoria(negocioId, { nombre: "General" });
        const serv = await serviciosService.crearServicio(negocioId, {
            nombre: "Lavado Cobro",
            precioActual: 3500,
            categoriaId: cat.id
        });
        servicioId = serv.id;

        const pedido = await pedidosService.crearPedido(negocioId, {
            clienteId,
            items: [{ productoId: servicioId, cantidad: 1 }]
        });
        pedidoId = pedido.numeroPedido || pedido.id;
    });

    it("1. Debe autosembrar y listar los métodos de pago fijos", async () => {
        const metodos = await pagosService.obtenerMetodosPago(negocioId);

        expect(metodos).toBeDefined();
        expect(metodos.length).toBeGreaterThanOrEqual(5);
        expect(metodos.some(m => m.nombre === "Efectivo")).toBe(true);
    });

    it("2. Debe crear un método de pago personalizado", async () => {
        const nuevo = await pagosService.crearMetodoPago(negocioId, {
            nombre: "Cuenta DNI",
            icono: "Wallet"
        });

        expect(nuevo).toBeDefined();
        expect(nuevo.id).toBeDefined();
        expect(nuevo.nombre).toBe("Cuenta DNI");

        metodoId = nuevo.id;
    });

    it("3. Debe cambiar el estado activo de un método de pago", async () => {
        const toggled = await pagosService.toggleMetodoPago(negocioId, metodoId);
        expect(toggled.activo).toBe(false);
    });

    it("4. Debe registrar el pago de un pedido", async () => {
        const pago = await pagosService.registrarPago(negocioId, {
            pedidoId,
            monto: 3500,
            montoRecibido: 4000,
            dejarVueltoAFavor: true
        });

        expect(pago).toBeDefined();
        expect(pago.estado).toBe("COMPLETADO");
        expect(pago.montoAFavorGenerado).toBe(500);
    });

    it("5. Debe eliminar un método de pago personalizado", async () => {
        const res = await pagosService.eliminarMetodoPago(negocioId, metodoId);
        expect(res.message).toContain("eliminado");
    });
});
