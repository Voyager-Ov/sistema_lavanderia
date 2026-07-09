import * as categoriaService from "../../services/categorias/categoria.service.js";
import { successResponse } from "../../utils/response.util.js";

export const getCategorias = async (req, res, next) => {
    try {
        const result = await categoriaService.obtenerCategorias(req.user.negocioId, req.query);
        return successResponse(res, 200, null, result);
    } catch (error) {
        next(error);
    }
};

export const crearCategoria = async (req, res, next) => {
    try {
        const categoria = await categoriaService.crearCategoria(req.user.negocioId, req.body.nombre);
        return successResponse(res, 201, "Categoría creada con éxito", categoria);
    } catch (error) {
        next(error);
    }
};

export const actualizarCategoria = async (req, res, next) => {
    try {
        const categoria = await categoriaService.actualizarCategoria(req.user.negocioId, req.params.id, req.body.nombre);
        return successResponse(res, 200, "Categoría actualizada", categoria);
    } catch (error) {
        next(error);
    }
};

export const eliminarCategoria = async (req, res, next) => {
    try {
        await categoriaService.eliminarCategoria(req.user.negocioId, req.params.id);
        return successResponse(res, 200, "Categoría eliminada exitosamente");
    } catch (error) {
        next(error);
    }
};
