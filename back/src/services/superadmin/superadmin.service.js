import { AppError } from "../../utils/errors.js";
import { connectionManager } from "../../models/connectionManager.js";
import { getPaginationParams, getPagingData } from "../../utils/pagination.util.js";
import { Op } from "sequelize";

export const obtenerTodosLosNegocios = async (queryParams = {}) => {
    const { limit, offset, page } = getPaginationParams(queryParams);
    const { search, estadoSuscripcion } = queryParams;

    let where = {};
    if (estadoSuscripcion) {
        where.estadoSuscripcion = estadoSuscripcion;
    }
    if (search) {
        where[Op.or] = [
            { nombre: { [Op.iLike]: `%${search}%` } },
            { cuit: { [Op.iLike]: `%${search}%` } }
        ];
    }

    const { rows, count } = await connectionManager.centralModels.Negocio.findAndCountAll({
        where,
        order: [["createdAt", "DESC"]],
        limit,
        offset,
    });

    return getPagingData({ count, rows }, page, limit);
};

export const cambiarEstadoSuscripcion = async (negocioId, nuevoEstado) => {
    const estadosValidos = ["ACTIVA", "VENCIDA", "PRUEBA", "CANCELADA"];
    if (!estadosValidos.includes(nuevoEstado)) {
        throw new AppError(`Estado inválido. Debe ser uno de: ${estadosValidos.join(", ")}`, 400);
    }

    const negocio = await connectionManager.centralModels.Negocio.findByPk(negocioId);
    if (!negocio) {
        throw new AppError("Negocio no encontrado.", 404);
    }

    await negocio.update({ estadoSuscripcion: nuevoEstado });
    return negocio;
};
