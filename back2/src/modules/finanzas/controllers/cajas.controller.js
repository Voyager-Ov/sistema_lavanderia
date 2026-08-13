import { cajasService } from "../services/cajas.service.js";
import { successResponse } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.js";

const getTenantId = (req) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) {
        throw new AppError("No se ha identificado el negocio activo en la sesión.", 401, "TENANT_REQUIRED");
    }
    return negocioId;
};

export const obtenerCajaActual = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const caja = await cajasService.obtenerCajaActual(negocioId);
        return successResponse(res, 200, "Caja actual recuperada exitosamente", caja);
    } catch (error) {
        next(error);
    }
};

export const abrirCaja = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const caja = await cajasService.abrirCaja(negocioId, req.body);
        return successResponse(res, 201, "Turno de caja abierto exitosamente", caja);
    } catch (error) {
        next(error);
    }
};

export const cerrarCaja = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const caja = await cajasService.cerrarCaja(negocioId, req.params.id, req.body);
        return successResponse(res, 200, "Turno de caja cerrado exitosamente", caja);
    } catch (error) {
        next(error);
    }
};

export const obtenerHistorialCajas = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await cajasService.obtenerHistorialCajas(negocioId, req.query);
        return successResponse(res, 200, "Historial de cajas recuperado exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const obtenerCajaPorId = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const caja = await cajasService.obtenerCajaPorId(negocioId, req.params.id);
        return successResponse(res, 200, "Caja recuperada exitosamente", caja);
    } catch (error) {
        next(error);
    }
};
