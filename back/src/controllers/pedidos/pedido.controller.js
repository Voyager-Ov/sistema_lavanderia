import * as pedidoService from "../../services/pedidos/pedido.service.js";
import { successResponse } from "../../utils/response.util.js";

export const crearPedido = async (req, res, next) => {
    console.log("LLEGÓ AL CONTROLLER - crearPedido", req.body);
    try {
        const nuevoPedido = await pedidoService.crearPedido(req.user.negocioId, req.user.id, req.body);
        return successResponse(res, 201, "Pedido creado con éxito", nuevoPedido);
    } catch (error) {
        next(error);
    }
};

export const getPedidos = async (req, res, next) => {
    try {
        const pedidosData = await pedidoService.obtenerPedidos(req.user.negocioId, req.query);
        return successResponse(res, 200, null, pedidosData);
    } catch (error) {
        next(error);
    }
};

export const getPedidoById = async (req, res, next) => {
    try {
        const pedido = await pedidoService.obtenerPedidoPorId(req.user.negocioId, req.params.id);
        return successResponse(res, 200, null, pedido);
    } catch (error) {
        next(error);
    }
};

export const cambiarEstadoPedido = async (req, res, next) => {
    try {
        const pedidoActualizado = await pedidoService.cambiarEstadoPedido(
            req.user.negocioId, 
            req.user.id, 
            req.user.rol, 
            req.params.id, 
            req.body.estado, 
            req.body.comentario,
            req.body.motivoCancelacion,
            req.body.descripcionCancelacion
        );
        return successResponse(res, 200, "Estado del pedido actualizado", pedidoActualizado);
    } catch (error) {
        next(error);
    }
};

export const imprimirTicket = async (req, res, next) => {
    try {
        const html = await pedidoService.generarTicketHTML(req.user.negocioId, req.params.id);
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(html);
    } catch (error) {
        next(error);
    }
};

export const generarTickets = async (req, res, next) => {
    try {
        const cantidad = req.body.cantidad || 1;
        const tickets = await pedidoService.generarTickets(req.user.negocioId, req.params.id, cantidad);
        return successResponse(res, 201, "Tickets generados", tickets);
    } catch (error) {
        next(error);
    }
};

export const getTicketsPedido = async (req, res, next) => {
    try {
        const tickets = await pedidoService.getTicketsPedido(req.user.negocioId, req.params.id);
        return successResponse(res, 200, null, tickets);
    } catch (error) {
        next(error);
    }
};

export const generarFactura = async (req, res, next) => {
    try {
        const factura = await pedidoService.generarFacturaElectronica(req.user.negocioId, req.params.id);
        return successResponse(res, 200, "Factura generada con éxito", factura);
    } catch (error) {
        next(error);
    }
};
