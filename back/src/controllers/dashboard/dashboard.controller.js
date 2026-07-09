import * as dashboardService from "../../services/dashboard/dashboard.service.js";
import { successResponse } from "../../utils/response.util.js";

export const getDashboardOverview = async (req, res, next) => {
    try {
        const stats = await dashboardService.getDashboardStats(req.user.negocioId);
        return successResponse(res, 200, null, stats);
    } catch (error) {
        next(error);
    }
};

export const getCierreCajaOverview = async (req, res, next) => {
    try {
        const stats = await dashboardService.getCierreDeCajaStats(req.user.negocioId, req.params.cajaId);
        return successResponse(res, 200, null, stats);
    } catch (error) {
        next(error);
    }
};
