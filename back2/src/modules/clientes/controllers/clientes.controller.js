import { clientesService } from "../services/clientes.service.js";
import { successResponse } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.js";

const getTenantId = (req) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) {
        throw new AppError("No se ha identificado el negocio activo en la sesión.", 401, "MISSING_TENANT_ID");
    }
    return negocioId;
};

const getAuthUserId = (req) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError("Usuario no autenticado o sesión inválida.", 401, "UNAUTHORIZED");
    }
    return userId;
};

export const listarClientes = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await clientesService.listarClientes(negocioId, req.query);
        return successResponse(res, 200, "Clientes recuperados exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const obtenerClientePorId = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const clienteId = parseInt(req.params.id, 10);
        const cliente = await clientesService.obtenerClientePorId(negocioId, clienteId);
        return successResponse(res, 200, "Cliente recuperado exitosamente", cliente);
    } catch (error) {
        next(error);
    }
};

export const crearCliente = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const cliente = await clientesService.crearCliente(negocioId, req.body);
        return successResponse(res, 201, "Cliente creado exitosamente", cliente);
    } catch (error) {
        next(error);
    }
};

export const actualizarCliente = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const clienteId = parseInt(req.params.id, 10);
        const cliente = await clientesService.actualizarCliente(negocioId, clienteId, req.body);
        return successResponse(res, 200, "Cliente actualizado exitosamente", cliente);
    } catch (error) {
        next(error);
    }
};

export const eliminarCliente = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const clienteId = parseInt(req.params.id, 10);
        const result = await clientesService.eliminarCliente(negocioId, clienteId);
        return successResponse(res, 200, "Cliente eliminado exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const obtenerPedidosImpagosCliente = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const clienteId = parseInt(req.params.id, 10);
        const result = await clientesService.obtenerPedidosImpagosCliente(negocioId, clienteId);
        return successResponse(res, 200, "Pedidos impagos recuperados exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const cobrarPedidosCliente = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const clienteId = parseInt(req.params.id, 10);
        const empleadoId = getAuthUserId(req);
        const result = await clientesService.cobrarPedidosCliente(negocioId, clienteId, { ...req.body, empleadoId });
        return successResponse(res, 200, "Cobro de pedidos del cliente registrado exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const obtenerEstadoCuentaCliente = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const clienteId = parseInt(req.params.id, 10);
        const result = await clientesService.obtenerEstadoCuenta(negocioId, clienteId);
        return successResponse(res, 200, "Estado de cuenta recuperado exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const obtenerMovimientosCuentaCliente = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const clienteId = parseInt(req.params.id, 10);
        const result = await clientesService.obtenerMovimientosCuenta(negocioId, clienteId);
        return successResponse(res, 200, "Movimientos de cuenta corriente recuperados exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const ajustarCreditoCliente = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const clienteId = parseInt(req.params.id, 10);
        const empleadoId = getAuthUserId(req);
        const result = await clientesService.ajustarCreditoCliente(negocioId, clienteId, { ...req.body, empleadoId });
        return successResponse(res, 200, "Ajuste de crédito registrado exitosamente", result);
    } catch (error) {
        next(error);
    }
};
