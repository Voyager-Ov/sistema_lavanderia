import { estadoEmpleadosService } from "../services/estadoEmpleados.service.js";
import { successResponse } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.js";

const getTenantId = (req) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 401, "TENANT_REQUIRED");
    return negocioId;
};

export const cambiarEstadoEmpleado = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const empleado = await estadoEmpleadosService.cambiarEstadoEmpleado(negocioId, req.params.id, req.body.activo);
        return successResponse(res, 200, "Estado del empleado actualizado exitosamente", empleado);
    } catch (error) {
        next(error);
    }
};
