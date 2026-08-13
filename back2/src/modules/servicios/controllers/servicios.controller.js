import { serviciosService } from "../services/servicios.service.js";
import { successResponse } from "../../../utils/response.util.js";

// ─── CONTROLADORES DE SERVICIOS / PRODUCTOS ───

export const listarServicios = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const result = await serviciosService.listarServicios(negocioId, req.query);
        return successResponse(res, 200, "Servicios recuperados exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const obtenerEstadisticas = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const stats = await serviciosService.obtenerEstadisticas(negocioId);
        return successResponse(res, 200, "Estadísticas recuperadas exitosamente", stats);
    } catch (error) {
        next(error);
    }
};

export const obtenerServicioPorId = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const servicio = await serviciosService.obtenerServicioPorId(negocioId, req.params.id);
        return successResponse(res, 200, "Servicio recuperado exitosamente", servicio);
    } catch (error) {
        next(error);
    }
};

export const crearServicio = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const imagenPath = req.file ? `/uploads/productos/${req.file.filename}` : null;
        
        const servicio = await serviciosService.crearServicio(negocioId, req.body, imagenPath);
        return successResponse(res, 201, "Servicio creado exitosamente", servicio);
    } catch (error) {
        next(error);
    }
};

export const actualizarServicio = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const imagenPath = req.file ? `/uploads/productos/${req.file.filename}` : null;

        const servicio = await serviciosService.actualizarServicio(negocioId, req.params.id, req.body, imagenPath);
        return successResponse(res, 200, "Servicio actualizado exitosamente", servicio);
    } catch (error) {
        next(error);
    }
};

export const eliminarServicio = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const result = await serviciosService.eliminarServicio(negocioId, req.params.id);
        return successResponse(res, 200, "Servicio eliminado exitosamente", result);
    } catch (error) {
        next(error);
    }
};

// ─── CONTROLADORES DE CATEGORÍAS ───

export const listarCategorias = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const result = await serviciosService.listarCategorias(negocioId);
        return successResponse(res, 200, "Categorías recuperadas exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const crearCategoria = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const categoria = await serviciosService.crearCategoria(negocioId, req.body);
        return successResponse(res, 201, "Categoría creada exitosamente", categoria);
    } catch (error) {
        next(error);
    }
};

export const actualizarCategoria = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const categoria = await serviciosService.actualizarCategoria(negocioId, req.params.id, req.body);
        return successResponse(res, 200, "Categoría actualizada exitosamente", categoria);
    } catch (error) {
        next(error);
    }
};

export const eliminarCategoria = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const result = await serviciosService.eliminarCategoria(negocioId, req.params.id);
        return successResponse(res, 200, "Categoría eliminada exitosamente", result);
    } catch (error) {
        next(error);
    }
};
