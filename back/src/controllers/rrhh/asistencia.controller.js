import * as asistenciaService from "../../services/rrhh/asistencia.service.js";
import { successResponse } from "../../utils/response.util.js";

export const ficharEntrada = async (req, res, next) => {
    try {
        const registro = await asistenciaService.ficharEntrada(req.user.id);
        return successResponse(res, 201, "Entrada registrada correctamente", registro);
    } catch (error) {
        next(error);
    }
};

export const ficharSalida = async (req, res, next) => {
    try {
        const registro = await asistenciaService.ficharSalida(req.user.id);
        return successResponse(res, 200, "Salida registrada correctamente", registro);
    } catch (error) {
        next(error);
    }
};

export const getAsistencias = async (req, res, next) => {
    try {
        const asistenciasData = await asistenciaService.obtenerAsistencias(req.user.negocioId, req.user.id, req.user.rol, req.query);
        return successResponse(res, 200, null, asistenciasData);
    } catch (error) {
        next(error);
    }
};
