import { cajasService } from "../services/cajas.service.js";
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
    const empId = req.user?.empleadoId ?? req.user?.id;
    if (!empId) {
        throw new AppError("Empleado no autenticado en la sesión.", 401, "UNAUTHORIZED");
    }
    return empId;
};

export const obtenerCajaActual = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const empleadoId = getAuthEmpleadoId(req);
        const incluirUltimaCerrada = req.query.incluirUltimaCerrada === "true";
        const caja = await cajasService.obtenerCajaActual(negocioId, empleadoId, incluirUltimaCerrada);
        return successResponse(res, 200, "Caja actual recuperada exitosamente", caja);
    } catch (error) {
        next(error);
    }
};

export const obtenerCajasAbiertas = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const cajas = await cajasService.obtenerCajasAbiertas(negocioId);
        return successResponse(res, 200, "Cajas abiertas recuperadas exitosamente", cajas);
    } catch (error) {
        next(error);
    }
};

export const abrirCaja = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const empleadoId = getAuthEmpleadoId(req);
        const caja = await cajasService.abrirCaja(negocioId, { ...req.body, empleadoId });
        return successResponse(res, 201, "Turno de caja abierto exitosamente", caja);
    } catch (error) {
        next(error);
    }
};

export const cerrarCaja = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const userRol = (req.user?.rol || "").toUpperCase().replace("_", "").trim();
        const isGlobalAdmin = userRol.includes("ADMIN") || userRol === "SUPERADMIN";
        const empleadoId = getAuthEmpleadoId(req);

        const caja = await cajasService.cerrarCaja(negocioId, req.params.id, req.body, empleadoId, isGlobalAdmin);
        return successResponse(res, 200, "Turno de caja cerrado exitosamente", caja);
    } catch (error) {
        next(error);
    }
};

export const obtenerHistorialCajas = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const userRol = (req.user?.rol || "").toUpperCase().replace("_", "").trim();
        const isGlobalAdmin = userRol.includes("ADMIN") || userRol === "SUPERADMIN";

        const query = { ...req.query };
        if (!isGlobalAdmin) {
            query.empleadoId = getAuthEmpleadoId(req);
        }

        const result = await cajasService.obtenerHistorialCajas(negocioId, query);
        return successResponse(res, 200, "Historial de cajas recuperado exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const obtenerCajaPorId = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const caja = await cajasService.obtenerCajaPorId(negocioId, req.params.id);

        const userRol = (req.user?.rol || "").toUpperCase().replace("_", "").trim();
        const isGlobalAdmin = userRol.includes("ADMIN") || userRol === "SUPERADMIN";
        const userEmpleadoId = getAuthEmpleadoId(req);

        if (!isGlobalAdmin && userEmpleadoId && caja.usuarioId && Number(caja.usuarioId) !== Number(userEmpleadoId)) {
            throw new AppError("No posees permisos para acceder a este turno de caja.", 403, "FORBIDDEN");
        }

        return successResponse(res, 200, "Caja recuperada exitosamente", caja);
    } catch (error) {
        next(error);
    }
};
