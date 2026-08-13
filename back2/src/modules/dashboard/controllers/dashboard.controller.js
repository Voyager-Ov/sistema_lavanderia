import { dashboardService } from "../services/dashboard.service.js";
import { successResponse } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.js";

const getTenantId = (req) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) {
        throw new AppError("No se ha identificado el negocio activo en la sesión.", 401, "TENANT_REQUIRED");
    }
    return negocioId;
};

export const obtenerEstadisticasDashboard = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const stats = await dashboardService.obtenerEstadisticasDashboard(negocioId);
        return successResponse(res, 200, "Estadísticas del dashboard recuperadas exitosamente", stats);
    } catch (error) {
        next(error);
    }
};
