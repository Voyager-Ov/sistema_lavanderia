import { pagosService } from "../services/pagos.service.js";
import { successResponse } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.js";

const getTenantId = (req) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) {
        throw new AppError("No se ha identificado el negocio activo en la sesión.", 401, "TENANT_REQUIRED");
    }
    return negocioId;
};

const getAuthEmpleadoId = (req) => {
    const empId = req.user?.empleadoId;
    if (!empId) {
        throw new AppError("Empleado no autenticado en la sesión.", 401, "UNAUTHORIZED");
    }
    return empId;
};

export const obtenerMetodosPago = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const metodos = await pagosService.obtenerMetodosPago(negocioId);
        return successResponse(res, 200, "Métodos de pago recuperados exitosamente", metodos);
    } catch (error) {
        next(error);
    }
};

export const crearMetodoPago = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const metodo = await pagosService.crearMetodoPago(negocioId, req.body);
        return successResponse(res, 201, "Método de pago creado exitosamente", metodo);
    } catch (error) {
        next(error);
    }
};

export const actualizarMetodoPago = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const metodo = await pagosService.actualizarMetodoPago(negocioId, req.params.id, req.body);
        return successResponse(res, 200, "Método de pago actualizado exitosamente", metodo);
    } catch (error) {
        next(error);
    }
};

export const toggleMetodoPago = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const metodo = await pagosService.toggleMetodoPago(negocioId, req.params.id);
        return successResponse(res, 200, "Estado del método de pago actualizado exitosamente", metodo);
    } catch (error) {
        next(error);
    }
};

export const eliminarMetodoPago = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await pagosService.eliminarMetodoPago(negocioId, req.params.id);
        return successResponse(res, 200, "Método de pago eliminado exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const registrarPago = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const empleadoId = getAuthEmpleadoId(req);
        const pago = await pagosService.registrarPago(negocioId, { ...req.body, empleadoId });
        return successResponse(res, 201, "Pago registrado exitosamente", pago);
    } catch (error) {
        next(error);
    }
};

export const obtenerSaldosAFavorCliente = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const saldos = await pagosService.obtenerSaldosAFavorCliente(negocioId, req.params.clienteId);
        return successResponse(res, 200, "Saldos a favor recuperados exitosamente", saldos);
    } catch (error) {
        next(error);
    }
};
