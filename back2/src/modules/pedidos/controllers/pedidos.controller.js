import { pedidosService } from "../services/pedidos.service.js";
import { successResponse } from "../../../utils/response.util.js";

export const listarPedidos = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const result = await pedidosService.listarPedidos(negocioId, req.query);
        return successResponse(res, 200, "Pedidos recuperados exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const obtenerEstadisticas = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const stats = await pedidosService.obtenerEstadisticas(negocioId);
        return successResponse(res, 200, "Estadísticas de pedidos recuperadas exitosamente", stats);
    } catch (error) {
        next(error);
    }
};

export const obtenerPedidoPorNumero = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const pedido = await pedidosService.obtenerPedidoPorNumero(negocioId, req.params.id);
        return successResponse(res, 200, "Pedido recuperado exitosamente", pedido);
    } catch (error) {
        next(error);
    }
};

export const crearPedido = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const pedido = await pedidosService.crearPedido(negocioId, req.body);
        return successResponse(res, 201, "Pedido creado exitosamente", pedido);
    } catch (error) {
        next(error);
    }
};

export const cambiarEstado = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const { estado } = req.body;
        const pedido = await pedidosService.cambiarEstado(negocioId, req.params.id, estado);
        return successResponse(res, 200, "Estado del pedido actualizado exitosamente", pedido);
    } catch (error) {
        next(error);
    }
};

export const marcarTicketImpreso = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const result = await pedidosService.marcarTicketImpreso(negocioId, req.params.id);
        return successResponse(res, 200, "Ticket marcado como impreso exitosamente", result);
    } catch (error) {
        next(error);
    }
};
