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
        if (req.body.disponible === undefined) {
            throw new AppError("El campo 'disponible' es requerido.", 400, "MISSING_DISPONIBLE_FIELD");
        }
        const servicio = await serviciosService.cambiarDisponibilidad(negocioId, req.params.id, req.body.disponible);
        return successResponse(res, 200, "Disponibilidad del servicio actualizada exitosamente", servicio);
    } catch (error) {
        next(error);
    }
};

export const actualizarPreciosMasivo = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const { servicios } = req.body;
        if (!servicios) {
            throw new AppError("El campo 'servicios' es requerido en el cuerpo de la solicitud.", 400, "MISSING_SERVICES_ARRAY");
        }
        const result = await serviciosService.actualizarPreciosMasivo(negocioId, servicios);
        return successResponse(res, 200, "Precios actualizados masivamente", result);
    } catch (error) {
        next(error);
    }
};

export const actualizarDisponibilidadMasiva = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const { ids, disponible } = req.body;
        if (!ids || disponible === undefined) {
            throw new AppError("Los campos 'ids' y 'disponible' son requeridos.", 400, "MISSING_REQUIRED_FIELDS");
        }
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

// ─── CONTROLADORES DE CATEGORÍAS DE SERVICIOS ───

export const listarCategorias = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await categoriasService.listarCategorias(negocioId);
        return successResponse(res, 200, "Categorías recuperadas exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const crearCategoria = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const categoria = await categoriasService.crearCategoria(negocioId, req.body);
        return successResponse(res, 201, "Categoría creada exitosamente", categoria);
    } catch (error) {
        next(error);
    }
};

export const actualizarCategoria = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const categoria = await categoriasService.actualizarCategoria(negocioId, req.params.id, req.body);
        return successResponse(res, 200, "Categoría actualizada exitosamente", categoria);
    } catch (error) {
        next(error);
    }
};

export const eliminarCategoria = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await categoriasService.eliminarCategoria(negocioId, req.params.id);
        return successResponse(res, 200, "Categoría eliminada exitosamente", result);
    } catch (error) {
        next(error);
    }
};
