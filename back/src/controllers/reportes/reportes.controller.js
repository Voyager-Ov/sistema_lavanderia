import * as ReportesService from "../../services/reportes/reportes.service.js";
import { successResponse } from "../../utils/response.util.js";
import { AppError } from "../../utils/errors.js";

/**
 * Obtiene el reporte de servicios
 * Query params: fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD)
 */
export const getServiciosReport = async (req, res, next) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        const negocioId = req.user.negocioId;

        if (!negocioId) {
            throw new AppError("No se ha identificado el negocio del usuario", 400);
        }

        const data = await ReportesService.getServiciosReportData(negocioId, fechaInicio, fechaFin);

        return successResponse(res, 200, "Reporte de servicios generado correctamente", data);
    } catch (error) {
        next(error);
    }
};

/**
 * Obtiene el reporte de pedidos
 * Query params: fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD)
 */
export const getPedidosReport = async (req, res, next) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        const negocioId = req.user.negocioId;

        if (!negocioId) {
            throw new AppError("No se ha identificado el negocio del usuario", 400);
        }

        const data = await ReportesService.getPedidosReportData(negocioId, fechaInicio, fechaFin);

        return successResponse(res, 200, "Reporte de pedidos generado correctamente", data);
    } catch (error) {
        next(error);
    }
};

/**
 * Obtiene el reporte de empleados
 * Query params: fechaInicio (YYYY-MM-DD), fechaFin (YYYY-MM-DD)
 */
export const getEmpleadosReport = async (req, res, next) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        const negocioId = req.user.negocioId;

        if (!negocioId) {
            throw new AppError("No se ha identificado el negocio del usuario", 400);
        }

        const data = await ReportesService.getEmpleadosReportData(negocioId, fechaInicio, fechaFin);

        return successResponse(res, 200, "Reporte de empleados generado correctamente", data);
    } catch (error) {
        next(error);
    }
};
