import { anulacionGastosService } from "../services/anulacionGastos.service.js";
import { successResponse } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.js";

const getTenantId = (req) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 401, "TENANT_REQUIRED");
    return negocioId;
};

export const anularGasto = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await anulacionGastosService.anularGasto(negocioId, req.params.id);
        return successResponse(res, 200, "Gasto anulado exitosamente", result);
    } catch (error) {
        next(error);
    }
};
