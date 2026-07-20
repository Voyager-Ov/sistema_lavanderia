import { AppError } from "../../utils/errors.js";
import { models, sequelize } from "../../models/index.js";
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
    if (queryParams.disponible !== undefined) {
        where.disponible = queryParams.disponible === 'true';
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

export const obtenerProductoPorId = async (id, negocioId) => {
    const producto = await models.Producto.findOne({ 
        where: { id, negocioId, activo: true },
        include: [{ model: models.CategoriaProducto, as: "categoria", attributes: ["id", "nombre"] }]
    });
    if (!producto) throw new AppError("Producto no encontrado.", 404);
    return producto;
};

export const crearProducto = async (data, negocioId) => {
    const { categoriaId, nombre, precioActual, costoEstimado, tiempoEstimadoMinutos, imagenUrl } = data;

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
        tiempoEstimadoMinutos,
        imagenUrl,
        negocioId 
    });
};

export const actualizarProducto = async (id, data, negocioId) => {
    const { categoriaId, nombre, precioActual, costoEstimado, tiempoEstimadoMinutos, imagenUrl } = data;

    const t = await sequelize.transaction();

    try {
        const producto = await models.Producto.findOne({ where: { id, negocioId, activo: true }, transaction: t });
        if (!producto) throw new AppError("Producto no encontrado.", 404);

        if (categoriaId) {
            const cat = await models.CategoriaProducto.findOne({ where: { id: categoriaId, negocioId, activo: true }, transaction: t });
            if (!cat) throw new AppError("Categoría inválida o no encontrada.", 404);
        }

        if (precioActual !== undefined && Number(producto.precioActual) !== Number(precioActual)) {
            await models.HistorialPrecioProducto.create({
                productoId: producto.id,
                negocioId,
                precioAnterior: producto.precioActual,
                precioNuevo: precioActual
            }, { transaction: t });
        }

        const updates = { categoriaId, nombre, precioActual, costoEstimado, tiempoEstimadoMinutos };
        if (imagenUrl !== undefined) {
            updates.imagenUrl = imagenUrl;
        }

        await producto.update(updates, { transaction: t });
        
        await t.commit();
        return producto;
    } catch (error) {
        if (!t.finished) await t.rollback();
        throw error;
    }
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

export const obtenerHistorialPrecios = async (productoId, negocioId) => {
    return await models.HistorialPrecioProducto.findAll({
        where: { productoId, negocioId },
        order: [["createdAt", "DESC"]]
    });
};

export const obtenerStatsProductos = async (negocioId) => {
    const total = await models.Producto.count({ where: { negocioId, activo: true } });
    const disponibles = await models.Producto.count({ where: { negocioId, activo: true, disponible: true } });
    const categorias = await models.CategoriaProducto.count({ where: { negocioId, activo: true } });

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const items = await models.PedidoItem.findAll({
        attributes: [
            "productoId",
            [sequelize.fn("SUM", sequelize.col("cantidad")), "totalVendido"]
        ],
        include: [{
            model: models.Pedido,
            as: "pedido",
            attributes: [],
            where: { negocioId, createdAt: { [Op.gte]: inicioMes } }
        }],
        group: ["productoId"],
        order: [[sequelize.literal('"totalVendido"'), "DESC"]],
        limit: 1
    });

    let masSolicitado = null;
    if (items.length > 0) {
        const producto = await models.Producto.findByPk(items[0].productoId, { attributes: ["nombre"] });
        if (producto) {
            masSolicitado = {
                nombre: producto.nombre,
                cantidad: parseInt(items[0].get("totalVendido"))
            };
        }
    }

    return { total, activos: disponibles, categorias, masSolicitado };
};

export const actualizarPreciosMasivo = async (updates, negocioId) => {
    const t = await sequelize.transaction();
    try {
        for (const u of updates) {
            const producto = await models.Producto.findOne({ where: { id: u.id, negocioId, activo: true }, transaction: t });
            if (producto && Number(producto.precioActual) !== Number(u.precioActual)) {
                await models.HistorialPrecioProducto.create({
                    productoId: producto.id,
                    negocioId,
                    precioAnterior: producto.precioActual,
                    precioNuevo: u.precioActual
                }, { transaction: t });
                await producto.update({ precioActual: u.precioActual }, { transaction: t });
            }
        }
        await t.commit();
        return true;
    } catch (error) {
        if (!t.finished) await t.rollback();
        throw error;
    }
};

export const actualizarDisponibilidadMasiva = async (ids, disponible, negocioId) => {
    await models.Producto.update(
        { disponible },
        { where: { id: { [Op.in]: ids }, negocioId, activo: true } }
    );
    return true;
};
