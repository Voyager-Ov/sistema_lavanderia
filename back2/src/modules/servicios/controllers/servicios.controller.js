import { serviciosService } from "../services/servicios.service.js";
import { categoriasService } from "../services/categorias.service.js";
import { storageService } from "../../../services/storage.service.js";
import { successResponse } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.js";

const getTenantId = (req) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) {
        throw new AppError("No se ha identificado el negocio activo en la sesión.", 401, "TENANT_REQUIRED");
    }
    return negocioId;
};

// ─── CONTROLADORES DE SERVICIOS / PRODUCTOS ───

export const listarServicios = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await serviciosService.listarServicios(negocioId, req.query);
        return successResponse(res, 200, "Servicios recuperados exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const obtenerEstadisticas = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const stats = await serviciosService.obtenerEstadisticas(negocioId);
        return successResponse(res, 200, "Estadísticas recuperadas exitosamente", stats);
    } catch (error) {
        next(error);
    }
};

export const obtenerServicioPorId = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const servicio = await serviciosService.obtenerServicioPorId(negocioId, req.params.id);
        return successResponse(res, 200, "Servicio recuperado exitosamente", servicio);
    } catch (error) {
        next(error);
    }
};

export const crearServicio = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const imagenPath = req.file ? await storageService.uploadFile(req.file, "productos") : null;
        
        const servicio = await serviciosService.crearServicio(negocioId, req.body, imagenPath);
        return successResponse(res, 201, "Servicio creado exitosamente", servicio);
    } catch (error) {
        next(error);
    }
};

export const actualizarServicio = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const imagenPath = req.file ? await storageService.uploadFile(req.file, "productos") : null;

        const servicio = await serviciosService.actualizarServicio(negocioId, req.params.id, req.body, imagenPath);
        return successResponse(res, 200, "Servicio actualizado exitosamente", servicio);
    } catch (error) {
        next(error);
    }
};

export const cambiarDisponibilidad = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const servicio = await serviciosService.cambiarDisponibilidad(negocioId, req.params.id, req.body.disponible);
        return successResponse(res, 200, "Disponibilidad del servicio actualizada exitosamente", servicio);
    } catch (error) {
        next(error);
    }
};

export const actualizarPreciosMasivo = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await serviciosService.actualizarPreciosMasivo(negocioId, req.body.servicios || req.body);
        return successResponse(res, 200, "Precios actualizados masivamente", result);
    } catch (error) {
        next(error);
    }
};

export const actualizarDisponibilidadMasiva = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const { ids, disponible } = req.body;
        const result = await serviciosService.actualizarDisponibilidadMasiva(negocioId, ids, disponible);
        return successResponse(res, 200, "Disponibilidad actualizada masivamente", result);
    } catch (error) {
        next(error);
    }
};

export const obtenerHistorialPrecios = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const historial = await serviciosService.obtenerHistorialPrecios(negocioId, req.params.id);
        return successResponse(res, 200, "Historial de precios recuperado exitosamente", historial);
    } catch (error) {
        next(error);
    }
};

export const eliminarServicio = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await serviciosService.eliminarServicio(negocioId, req.params.id);
        return successResponse(res, 200, "Servicio eliminado exitosamente", result);
    } catch (error) {
        next(error);
    }
};
