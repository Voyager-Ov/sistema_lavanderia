import * as superadminService from "../../services/superadmin/superadmin.service.js";
import { successResponse } from "../../utils/response.util.js";

export const getNegocios = async (req, res, next) => {
    try {
        const negocios = await superadminService.obtenerTodosLosNegocios(req.query);
        return successResponse(res, 200, null, negocios);
    } catch (error) {
        next(error);
    }
};

export const updateEstadoSuscripcion = async (req, res, next) => {
    try {
        const negocioActualizado = await superadminService.cambiarEstadoSuscripcion(req.params.id, req.body.estadoSuscripcion);
        return successResponse(res, 200, "Estado de suscripción actualizado", negocioActualizado);
    } catch (error) {
        next(error);
    }
};
