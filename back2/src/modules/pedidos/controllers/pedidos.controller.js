import { pedidosService } from "../services/pedidos.service.js";
import { trazabilidadService } from "../services/trazabilidad.service.js";
import { cancelacionService } from "../services/cancelacion.service.js";
import { facturacionService } from "../services/facturacion.service.js";
import { ticketService } from "../services/ticket.service.js";
import { trackingService } from "../services/tracking.service.js";
import { pedidosSocket } from "../sockets/pedidos.socket.js";
import { successResponse } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.js";

const getTenantId = (req) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) {
        throw new AppError("No se ha identificado el negocio activo en la sesión.", 401, "TENANT_REQUIRED");
    }
    return negocioId;
};

export const listarPedidos = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await pedidosService.listarPedidos(negocioId, req.query);
        return successResponse(res, 200, "Pedidos recuperados exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const obtenerEstadisticas = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const stats = await pedidosService.obtenerEstadisticas(negocioId);
        return successResponse(res, 200, "Estadísticas de pedidos recuperadas exitosamente", stats);
    } catch (error) {
        next(error);
    }
};

export const obtenerPedidoPorNumero = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const pedido = await pedidosService.obtenerPedidoPorNumero(negocioId, req.params.id);
        return successResponse(res, 200, "Pedido recuperado exitosamente", pedido);
    } catch (error) {
        next(error);
    }
};

export const crearPedido = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const pedido = await pedidosService.crearPedido(negocioId, req.body);
        return successResponse(res, 201, "Pedido creado exitosamente", pedido);
    } catch (error) {
        next(error);
    }
};

export const cambiarEstado = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const { estado, motivoCancelacion, descripcionCancelacion, accionDinero } = req.body;

        if (estado === "CANCELADO") {
            const empleadoId = req.user?.empleadoId || req.user?.id;
            if (!empleadoId) {
                throw new AppError("No se ha identificado el empleado activo en la sesión.", 401, "MISSING_USER_ID");
            }
            await cancelacionService.cancelarPedido(negocioId, req.params.id, {
                motivoCancelacion,
                descripcionCancelacion,
                accionDinero,
                empleadoId
            });
        } else {
            await trazabilidadService.cambiarEstado(negocioId, req.params.id, estado);
        }

        const pedidoActualizado = await pedidosService.obtenerPedidoPorNumero(negocioId, req.params.id);
        
        pedidosSocket.emitirEstadoCambiado(negocioId, pedidoActualizado, estado);
        
        return successResponse(res, 200, "Estado del pedido actualizado exitosamente", pedidoActualizado);
    } catch (error) {
        next(error);
    }
};

export const generarFactura = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await facturacionService.generarFactura(negocioId, req.params.id);
        return successResponse(res, 200, "Factura generada exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const obtenerTicketHTML = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const html = await ticketService.obtenerTicketHTML(negocioId, req.params.id);
        res.setHeader("Content-Type", "text/html");
        return res.status(200).send(html);
    } catch (error) {
        next(error);
    }
};

export const marcarTicketImpreso = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await trazabilidadService.marcarTicketImpreso(negocioId, req.params.id);
        return successResponse(res, 200, "Ticket marcado como impreso exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const generarTicketsPrenda = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const cantidad = Number(req.body.cantidad);
        if (isNaN(cantidad) || cantidad <= 0) {
            throw new AppError("La cantidad debe ser un número mayor a 0.", 400, "INVALID_DATA");
        }
        const tickets = await ticketService.generarTicketsPrenda(negocioId, req.params.id, cantidad);
        return successResponse(res, 201, "Tickets de prendas generados exitosamente", tickets);
    } catch (error) {
        next(error);
    }
};

export const obtenerTicketsPrenda = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const tickets = await ticketService.obtenerTicketsPrenda(negocioId, req.params.id);
        return successResponse(res, 200, "Tickets de prendas recuperados exitosamente", tickets);
    } catch (error) {
        next(error);
    }
};

export const obtenerTrackingPublico = async (req, res, next) => {
    try {
        const { negocioId, codigo } = req.params;
        const token = req.query.token;
        const info = await trackingService.obtenerTrackingPublico(negocioId, codigo, token);
        return successResponse(res, 200, "Información de seguimiento recuperada exitosamente", info);
    } catch (error) {
        next(error);
    }
};
