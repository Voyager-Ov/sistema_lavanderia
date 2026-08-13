import { clientesService } from "../services/clientes.service.js";
import { successResponse } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.js";

const getTenantId = (req) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) {
        throw new AppError("No se ha identificado el negocio activo en la sesión.", 401, "TENANT_REQUIRED");
    }
    return negocioId;
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
        const cliente = await clientesService.obtenerClientePorId(negocioId, req.params.id);
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
        const cliente = await clientesService.actualizarCliente(negocioId, req.params.id, req.body);
        return successResponse(res, 200, "Cliente actualizado exitosamente", cliente);
    } catch (error) {
        next(error);
    }
};

export const eliminarCliente = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await clientesService.eliminarCliente(negocioId, req.params.id);
        return successResponse(res, 200, "Cliente eliminado exitosamente", result);
    } catch (error) {
        next(error);
    }
};
