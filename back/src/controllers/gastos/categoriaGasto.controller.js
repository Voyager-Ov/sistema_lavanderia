import { models } from "../../models/index.js";
import { successResponse, errorResponse } from "../../utils/response.util.js";

// Obtener todas las categorías de gastos
export const getCategorias = async (req, res, next) => {
    try {
        const { negocioId } = req.user;
        
        // Obtener categorías personalizadas del negocio
        const categoriasPersonalizadas = await models.CategoriaGasto.findAll({
            where: { negocioId },
            order: [["nombre", "ASC"]]
        });
        
        return successResponse(res, 200, "Categorías obtenidas correctamente", categoriasPersonalizadas);
    } catch (error) {
        next(error);
    }
};

// Crear una nueva categoría
export const createCategoria = async (req, res, next) => {
    try {
        const { negocioId } = req.user;
        const { nombre } = req.body;

        if (!nombre || nombre.trim() === "") {
            return errorResponse(res, 400, "El nombre de la categoría es obligatorio");
        }

        // Validar si ya existe
        const existe = await models.CategoriaGasto.findOne({
            where: { negocioId, nombre: nombre.trim() }
        });

        if (existe) {
            return errorResponse(res, 400, "Ya existe una categoría con ese nombre");
        }

        const nuevaCategoria = await models.CategoriaGasto.create({
            negocioId,
            nombre: nombre.trim()
        });

        return successResponse(res, 201, "Categoría creada correctamente", nuevaCategoria);
    } catch (error) {
        next(error);
    }
};

// Eliminar una categoría
export const deleteCategoria = async (req, res, next) => {
    try {
        const { negocioId } = req.user;
        const { id } = req.params;

        const categoria = await models.CategoriaGasto.findOne({
            where: { id, negocioId }
        });

        if (!categoria) {
            return errorResponse(res, 404, "Categoría no encontrada");
        }

        await categoria.destroy();

        return successResponse(res, 200, "Categoría eliminada correctamente");
    } catch (error) {
        next(error);
    }
};
