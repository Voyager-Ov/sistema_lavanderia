import { AppError } from "../../utils/errors.js";
import { models } from "../../models/index.js";
import { getPaginationParams, getPagingData } from "../../utils/pagination.util.js";
import { Op } from "sequelize";

export const obtenerCategorias = async (negocioId, queryParams = {}) => {
    const { limit, offset, page } = getPaginationParams(queryParams);
    const { search } = queryParams;

    let where = { negocioId, activo: true };
    if (search) {
        where.nombre = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await models.CategoriaProducto.findAndCountAll({ 
        where,
        order: [["createdAt", "DESC"]],
        limit,
        offset
    });
    
    return getPagingData({ count, rows }, page, limit);
};

export const crearCategoria = async (negocioId, nombre) => {
    const existe = await models.CategoriaProducto.findOne({ where: { nombre, negocioId, activo: true } });
    if (existe) throw new AppError("La categoría ya existe.", 400);

    return await models.CategoriaProducto.create({ negocioId, nombre, activo: true });
};

export const actualizarCategoria = async (negocioId, id, nombre) => {
    const categoria = await models.CategoriaProducto.findOne({ where: { id, negocioId, activo: true } });
    if (!categoria) throw new AppError("Categoría no encontrada.", 404);

    // Verificar si el nuevo nombre choca con otra categoría activa
    const existe = await models.CategoriaProducto.findOne({ where: { nombre, negocioId, activo: true } });
    if (existe && existe.id !== parseInt(id)) {
        throw new AppError("Ya existe otra categoría con ese nombre.", 400);
    }

    await categoria.update({ nombre });
    return categoria;
};

export const eliminarCategoria = async (negocioId, id) => {
    const categoria = await models.CategoriaProducto.findOne({
        where: { id, negocioId, activo: true }
    });
    if (!categoria) throw new AppError("Categoría no encontrada.", 404);

    const productosAsociados = await models.Producto.count({ where: { categoriaId: id, activo: true } });
    if (productosAsociados > 0) {
        throw new AppError(`No se puede eliminar porque tiene ${productosAsociados} producto(s) activo(s) asociado(s).`, 400);
    }

    await categoria.update({ activo: false });
    return true;
};
