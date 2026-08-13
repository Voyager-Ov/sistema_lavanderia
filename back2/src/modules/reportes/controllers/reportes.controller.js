import { reportesService } from "../services/reportes.service.js";
import { successResponse } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.js";

const getTenantId = (req) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) {
        throw new AppError("No se ha identificado el negocio activo en la sesión.", 401, "TENANT_REQUIRED");
    }
    return negocioId;
};

export const obtenerReporteVentasPorMetodoPago = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const report = await reportesService.obtenerReporteVentasPorMetodoPago(negocioId, req.query);
        return successResponse(res, 200, "Reporte de ventas por método de pago generado exitosamente", report);
    } catch (error) {
        next(error);
    }
};

export const obtenerReporteGeneralFinanzas = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const report = await reportesService.obtenerReporteGeneralFinanzas(negocioId, req.query);
        return successResponse(res, 200, "Reporte general de finanzas generado exitosamente", report);
    } catch (error) {
        next(error);
    }
};

export const obtenerReporteEmpleados = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const report = await reportesService.obtenerReporteEmpleados(negocioId, req.query);
        return successResponse(res, 200, "Reporte de empleados generado exitosamente", report);
    } catch (error) {
        next(error);
    }
};
