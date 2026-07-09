import * as pagoService from "../../services/pagos/pago.service.js";
import { successResponse } from "../../utils/response.util.js";

export const registrarPago = async (req, res, next) => {
    try {
        const nuevoPago = await pagoService.registrarPago(req.user.negocioId, req.user.id, req.body);
        return successResponse(res, 201, "Pago registrado en caja", nuevoPago);
    } catch (error) {
        next(error);
    }
};

export const anularPago = async (req, res, next) => {
    try {
        await pagoService.anularPago(req.user.negocioId, req.user.id, req.params.id);
        return successResponse(res, 200, "Pago anulado correctamente");
    } catch (error) {
        next(error);
    }
};

export const obtenerMetodosPago = async (req, res, next) => {
    try {
        const metodos = await pagoService.obtenerMetodosPago(req.user.negocioId);
        return successResponse(res, 200, "Métodos de pago obtenidos", metodos);
    } catch (error) {
        next(error);
    }
};

export const crearMetodoPago = async (req, res, next) => {
    try {
        const metodo = await pagoService.crearMetodoPago(req.user.negocioId, req.body);
        return successResponse(res, 201, "Método de pago creado", metodo);
    } catch (error) {
        next(error);
    }
};

export const facturarPagoRetroactivo = async (req, res, next) => {
    try {
        const pago = await pagoService.facturarPagoRetroactivo(req.user.negocioId, req.params.id);
        return successResponse(res, 200, "Pago facturado exitosamente", pago);
    } catch (error) {
        next(error);
    }
};
