import { AppError } from "../../utils/errors.js";
import { models } from "../../models/index.js";
import { getPaginationParams, getPagingData } from "../../utils/pagination.util.js";
import { Op } from "sequelize";

export const ficharEntrada = async (usuarioId) => {
    // Verificar si el usuario ya tiene un turno abierto (entrada sin salida)
    const turnoAbierto = await models.RegistroAsistencia.findOne({
        where: {
            usuarioId,
            fechaHoraSalida: null
        }
    });

    if (turnoAbierto) {
        throw new AppError("No se puede fichar entrada. Ya tienes un turno abierto sin finalizar.", 400);
    }

    return await models.RegistroAsistencia.create({
        usuarioId,
        fechaHoraEntrada: new Date()
    });
};

export const ficharSalida = async (usuarioId) => {
    const turnoAbierto = await models.RegistroAsistencia.findOne({
        where: {
            usuarioId,
            fechaHoraSalida: null
        }
    });

    if (!turnoAbierto) {
        throw new AppError("No se puede fichar salida. No tienes ningún turno abierto.", 400);
    }

    await turnoAbierto.update({
        fechaHoraSalida: new Date()
    });

    return turnoAbierto;
};

export const obtenerAsistencias = async (negocioId, usuarioId, rol, queryParams = {}) => {
    const { limit, offset, page } = getPaginationParams(queryParams);
    const { empleadoId, fechaInicio, fechaFin } = queryParams;

    let whereClause = {};

    if (rol.toUpperCase() === "EMPLEADO") {
        whereClause.usuarioId = usuarioId;
    } else if (empleadoId) {
        whereClause.usuarioId = empleadoId;
    }

    if (fechaInicio && fechaFin) {
        whereClause.fechaHoraEntrada = {
            [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
        };
    } else if (fechaInicio) {
        whereClause.fechaHoraEntrada = {
            [Op.gte]: new Date(fechaInicio)
        };
    } else if (fechaFin) {
        whereClause.fechaHoraEntrada = {
            [Op.lte]: new Date(fechaFin)
        };
    }

    const { rows: asistencias, count: totalItems } = await models.RegistroAsistencia.findAndCountAll({
        where: whereClause,
        order: [["fechaHoraEntrada", "DESC"]],
        limit,
        offset
    });

    // Como Usuario está en la DB Central, no podemos hacer un JOIN directo.
    // Llenamos la info del empleado manualmente
    const { connectionManager } = await import("../../models/index.js");
    const usuariosIds = [...new Set(asistencias.map(a => a.usuarioId))];
    const usuarios = await connectionManager.centralModels.Usuario.findAll({
        where: { id: usuariosIds, negocioId },
        attributes: ["id", "nombre", "rol"]
    });

    const usuariosMap = {};
    usuarios.forEach(u => usuariosMap[u.id] = u);

    // Formatear la respuesta
    const items = asistencias.map(a => {
        const json = a.toJSON();
        json.empleado = usuariosMap[a.usuarioId] || { id: a.usuarioId, nombre: "Desconocido", rol: "N/A" };
        return json;
    });

    return getPagingData({ count: totalItems, rows: items }, page, limit);
};
