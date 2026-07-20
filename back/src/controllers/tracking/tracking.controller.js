import * as trackingService from "../../services/tracking/tracking.service.js";
import { successResponse } from "../../utils/response.util.js";

export const getTrackingInfo = async (req, res, next) => {
    try {
        const { negocioId, codigo } = req.params;
        const trackingData = await trackingService.obtenerTrackingInfo(negocioId, codigo);
        return successResponse(res, 200, null, trackingData);
    } catch (error) {
        next(error);
    }
};
