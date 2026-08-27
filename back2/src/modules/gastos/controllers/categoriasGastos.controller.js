import { categoriasGastosService } from "../services/categoriasGastos.service.js";
import { successResponse } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.js";

const getTenantId = (req) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
    return negocioId;
};

export const obtenerCategorias = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const categorias = await categoriasGastosService.obtenerCategorias(negocioId);
        return successResponse(res, 200, "Categorías de gastos recuperadas exitosamente", categorias);
    } catch (error) {
        next(error);
    }
};

export const crearCategoria = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const categoria = await categoriasGastosService.crearCategoria(negocioId, req.body);
        return successResponse(res, 201, "Categoría de gasto creada exitosamente", categoria);
    } catch (error) {
        next(error);
    }
};

export const eliminarCategoria = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await categoriasGastosService.eliminarCategoria(negocioId, req.params.id);
        return successResponse(res, 200, "Categoría eliminada exitosamente", result);
    } catch (error) {
        next(error);
    }
};
