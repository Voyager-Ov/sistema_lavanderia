import * as trackingService from "../../services/tracking/tracking.service.js";
import { successResponse } from "../../utils/response.util.js";

export const getTrackingPedido = async (req, res, next) => {
    try {
        const data = await trackingService.obtenerTrackingPedido(req.params.codigo);
        return successResponse(res, 200, null, data);
    } catch (error) {
        next(error);
    }
};
