import * as gastoService from "../../services/gastos/gasto.service.js";
import { successResponse } from "../../utils/response.util.js";

export const registrarGasto = async (req, res, next) => {
    try {
        const nuevoGasto = await gastoService.registrarGasto(req.user.negocioId, req.user.id, req.user.rol, req.body);
        return successResponse(res, 201, "Gasto registrado en caja", nuevoGasto);
    } catch (error) {
        next(error);
    }
};

export const getGastos = async (req, res, next) => {
    try {
        const gastosData = await gastoService.obtenerGastos(req.user.negocioId, req.user.id, req.user.rol, req.query);
        return successResponse(res, 200, null, gastosData);
    } catch (error) {
        next(error);
    }
};
