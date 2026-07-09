import { AppError } from "../../utils/errors.js";
import { models } from "../../models/index.js";
import { getPaginationParams, getPagingData } from "../../utils/pagination.util.js";
import { Op } from "sequelize";

export const obtenerClientes = async (negocioId, queryParams = {}) => {
    const { limit, offset, page } = getPaginationParams(queryParams);
    const { search, sortBy, sortOrder } = queryParams;

    const where = { negocioId, activo: true };

    if (search) {
        where[Op.or] = [
            { nombre: { [Op.iLike]: `%${search}%` } },
            { telefono: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } }
        ];
    }

    let order = [["createdAt", "DESC"]];
    if (sortBy) {
        const direction = sortOrder && sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
        order = [[sortBy, direction]];
    }

    const data = await models.Cliente.findAndCountAll({
        where,
        order,
        limit,
        offset
    });

    return getPagingData(data, page, limit);
};

export const obtenerClientePorId = async (negocioId, clienteId) => {
    const cliente = await models.Cliente.findOne({
        where: { id: clienteId, negocioId },
        include: [
            { 
                model: models.Pedido, 
                as: "pedidos",
                required: false, // LEFT JOIN
                attributes: ["id", "estado", "total", "codigoSeguimiento", "createdAt"]
            }
        ],
        order: [[{ model: models.Pedido, as: "pedidos" }, "createdAt", "DESC"]]
    });

    if (!cliente) {
        throw new AppError("Cliente no encontrado.", 404);
    }
    return cliente;
};

export const crearCliente = async (negocioId, clienteData) => {
    const { nombre, telefono, email } = clienteData;

    const existeTelefono = await models.Cliente.findOne({ where: { telefono, negocioId } });
    if (existeTelefono) {
        throw new AppError("Ya existe un cliente con ese teléfono en este negocio.", 400);
    }

    const nuevoCliente = await models.Cliente.create({
        negocioId,
        nombre,
        telefono,
        email,
        activo: true
    });

    return nuevoCliente;
};

export const actualizarCliente = async (negocioId, clienteId, updateData) => {
    const { nombre, telefono, email } = updateData;

    const cliente = await models.Cliente.findOne({ where: { id: clienteId, negocioId } });
    if (!cliente) {
        throw new AppError("Cliente no encontrado.", 404);
    }

    if (telefono && telefono !== cliente.telefono) {
        const existeTelefono = await models.Cliente.findOne({ where: { telefono, negocioId } });
        if (existeTelefono) {
            throw new AppError("Ya existe otro cliente con ese teléfono en este negocio.", 400);
        }
    }

    await cliente.update({ nombre, telefono, email });
    return cliente;
};

export const desactivarCliente = async (negocioId, clienteId, motivoBaja) => {
    const cliente = await models.Cliente.findOne({ where: { id: clienteId, negocioId } });
    if (!cliente) {
        throw new AppError("Cliente no encontrado.", 404);
    }

    // Regla de Negocio: No se puede dar de baja a un cliente si tiene pedidos activos (No Entregados/Cancelados)
    const pedidosActivos = await models.Pedido.count({
        where: {
            clienteId,
            estado: {
                [Op.notIn]: ["ENTREGADO", "CANCELADO"]
            }
        }
    });

    if (pedidosActivos > 0) {
        throw new AppError(`No se puede dar de baja al cliente porque tiene ${pedidosActivos} pedido(s) en curso.`, 400);
    }

    await cliente.update({ activo: false, motivoBaja });
    return true;
};
