import { AppError } from "../../utils/errors.js";
import { models } from "../../models/index.js";
import { getPaginationParams, getPagingData } from "../../utils/pagination.util.js";
import { Op } from "sequelize";

export const obtenerProductos = async (negocioId, rol, queryParams = {}) => {
    const { limit, offset, page } = getPaginationParams(queryParams);
    const { search, categoriaId, sortBy, sortOrder } = queryParams;

    let where = { negocioId, activo: true };
    if (search) {
        where.nombre = { [Op.iLike]: `%${search}%` };
    }
    if (categoriaId) {
        where.categoriaId = categoriaId;
    }

    let order = [["createdAt", "DESC"]];
    if (sortBy) {
        const direction = sortOrder && sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
        if (sortBy === "categoria") {
            order = [[{ model: models.CategoriaProducto, as: "categoria" }, "nombre", direction]];
        } else {
            order = [[sortBy, direction]];
        }
    }

    const { count, rows: productos } = await models.Producto.findAndCountAll({
        where,
        include: [{ model: models.CategoriaProducto, as: "categoria", attributes: ["id", "nombre"] }],
        order,
        limit,
        offset
    });

    let items = productos;
    if (rol.toUpperCase() === "EMPLEADO") {
        items = productos.map(p => {
            const data = p.toJSON();
            delete data.costoEstimado;
            return data;
        });
    }

    return getPagingData({ count, rows: items }, page, limit);
};

export const crearProducto = async (data, negocioId) => {
    const { categoriaId, nombre, precioActual, costoEstimado } = data;

    // Validar categoría si viene
    if (categoriaId) {
        const cat = await models.CategoriaProducto.findOne({ where: { id: categoriaId, negocioId, activo: true } });
        if (!cat) throw new AppError("Categoría inválida o no encontrada.", 404);
    }

    return await models.Producto.create({ 
        categoriaId, 
        nombre, 
        precioActual, 
        costoEstimado,
        negocioId 
    });
};

export const actualizarProducto = async (id, data, negocioId) => {
    const { categoriaId, nombre, precioActual, costoEstimado } = data;

    const producto = await models.Producto.findOne({ where: { id, negocioId, activo: true } });
    if (!producto) throw new AppError("Producto no encontrado.", 404);

    if (categoriaId) {
        const cat = await models.CategoriaProducto.findOne({ where: { id: categoriaId, negocioId, activo: true } });
        if (!cat) throw new AppError("Categoría inválida o no encontrada.", 404);
    }

    await producto.update({ categoriaId, nombre, precioActual, costoEstimado });
    return producto;
};

export const actualizarDisponibilidad = async (id, disponible, negocioId) => {
    const producto = await models.Producto.findOne({ where: { id, negocioId, activo: true } });
    if (!producto) throw new AppError("Producto no encontrado.", 404);

    await producto.update({ disponible });
    return producto;
};

export const eliminarProducto = async (id, negocioId) => {
    const producto = await models.Producto.findOne({ where: { id, negocioId, activo: true } });
    if (!producto) throw new AppError("Producto no encontrado.", 404);

    // Soft Delete
    await producto.update({ activo: false });
    return true;
};
