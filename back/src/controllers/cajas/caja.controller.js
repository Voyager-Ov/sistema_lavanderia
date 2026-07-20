import * as cajaService from "../../services/cajas/caja.service.js";
import { successResponse } from "../../utils/response.util.js";

export const abrirCaja = async (req, res, next) => {
    try {
        const nuevaCaja = await cajaService.abrirCaja(req.user.negocioId, req.user.id, req.body.montoInicial);
        return successResponse(res, 201, "Caja abierta exitosamente", nuevaCaja);
    } catch (error) {
        next(error);
    }
};

export const getCajaActual = async (req, res, next) => {
    try {
        const caja = await cajaService.obtenerCajaActual(req.user.negocioId, req.user.id);
        return successResponse(res, 200, null, caja);
    } catch (error) {
        next(error);
    }
};

export const cerrarCaja = async (req, res, next) => {
    try {
        const cajaCerrada = await cajaService.cerrarCaja(req.user.negocioId, req.user.id, req.params.id, req.body.efectivoReal);
        return successResponse(res, 200, "Caja cerrada correctamente", cajaCerrada);
    } catch (error) {
        next(error);
    }
};

export const getHistorialCajas = async (req, res, next) => {
    try {
        const result = await cajaService.obtenerHistorialCajas(req.user.negocioId, req.user.id, req.user.rol, req.query);
        return successResponse(res, 200, null, result);
    } catch (error) {
        next(error);
    }
};

export const getCajaPorId = async (req, res, next) => {
    try {
        const caja = await cajaService.obtenerCajaPorId(req.user.negocioId, req.user.id, req.user.rol, req.params.id);
        return successResponse(res, 200, null, caja);
    } catch (error) {
        next(error);
    }
};
