import { desempenoEmpleadosService } from "../services/desempenoEmpleados.service.js";
import { successResponse } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.js";

const getTenantId = (req) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 401, "TENANT_REQUIRED");
    return negocioId;
};

export const obtenerMetricasEmpleado = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const metricas = await desempenoEmpleadosService.obtenerMetricasEmpleado(negocioId, req.params.id);
        return successResponse(res, 200, "Métricas del empleado recuperadas exitosamente", metricas);
    } catch (error) {
        next(error);
    }
};

export const obtenerReporteEmpleados = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const report = await desempenoEmpleadosService.obtenerReporteEmpleados(negocioId, req.query);
        return successResponse(res, 200, "Reporte de empleados generado exitosamente", report);
    } catch (error) {
        next(error);
    }
};
