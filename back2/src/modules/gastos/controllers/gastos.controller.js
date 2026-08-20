import { gastosService } from "../services/gastos.service.js";
import { successResponse } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.js";

const getTenantId = (req) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 401, "TENANT_REQUIRED");
    return negocioId;
};

export const registrarGasto = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const empleadoId = req.user?.empleadoId || req.user?.id;
        const gasto = await gastosService.registrarGasto(negocioId, { ...req.body, empleadoId });
        return successResponse(res, 201, "Gasto registrado exitosamente", gasto);
    } catch (error) {
        next(error);
    }
};

export const obtenerGastos = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await gastosService.obtenerGastos(negocioId, req.query);
        return successResponse(res, 200, "Gastos recuperados exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const obtenerGastoPorId = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const gasto = await gastosService.obtenerGastoPorId(negocioId, req.params.id);
        return successResponse(res, 200, "Gasto recuperado exitosamente", gasto);
    } catch (error) {
        next(error);
    }
};
