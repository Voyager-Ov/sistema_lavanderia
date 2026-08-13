import { serviciosService } from "../services/servicios.service.js";
import { categoriasService } from "../services/categorias.service.js";
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
        const imagenPath = req.file ? `/uploads/productos/${req.file.filename}` : null;
        
        const servicio = await serviciosService.crearServicio(negocioId, req.body, imagenPath);
        return successResponse(res, 201, "Servicio creado exitosamente", servicio);
    } catch (error) {
        next(error);
    }
};

export const actualizarServicio = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const imagenPath = req.file ? `/uploads/productos/${req.file.filename}` : null;

        const servicio = await serviciosService.actualizarServicio(negocioId, req.params.id, req.body, imagenPath);
        return successResponse(res, 200, "Servicio actualizado exitosamente", servicio);
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

// ─── CONTROLADORES DE CATEGORÍAS ───

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
