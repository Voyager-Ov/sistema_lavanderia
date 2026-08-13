import { empleadosService } from "../services/empleados.service.js";
import { successResponse } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.js";

const getTenantId = (req) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 401, "TENANT_REQUIRED");
    return negocioId;
};

export const obtenerEmpleados = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await empleadosService.obtenerEmpleados(negocioId, req.query);
        return successResponse(res, 200, "Empleados recuperados exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const crearEmpleado = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const empleado = await empleadosService.crearEmpleado(negocioId, req.body);
        return successResponse(res, 201, "Empleado registrado exitosamente", empleado);
    } catch (error) {
        next(error);
    }
};

export const obtenerEmpleadoPorId = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const empleado = await empleadosService.obtenerEmpleadoPorId(negocioId, req.params.id);
        return successResponse(res, 200, "Empleado recuperado exitosamente", empleado);
    } catch (error) {
        next(error);
    }
};

export const actualizarEmpleado = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const empleado = await empleadosService.actualizarEmpleado(negocioId, req.params.id, req.body);
        return successResponse(res, 200, "Empleado actualizado exitosamente", empleado);
    } catch (error) {
        next(error);
    }
};
