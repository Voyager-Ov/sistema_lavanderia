import { AppError } from "../../utils/errors.js";
import { models } from "../../models/index.js";
import { getPaginationParams, getPagingData } from "../../utils/pagination.util.js";
import { Op } from "sequelize";

export const registrarGasto = async (negocioId, usuarioId, rol, data) => {
    const { monto, categoria, descripcion } = data;

    const cajaAbierta = await models.Caja.findOne({ where: { negocioId, usuarioId, estado: "ABIERTA" } });
    if (!cajaAbierta) {
        throw new AppError("No se puede registrar gasto. Debe abrir una caja primero.", 400);
    }

    // RBAC Categorías
    const categoriasRestringidas = ["Nomina", "Servicios", "Alquiler"];
    if (rol.toUpperCase() === "EMPLEADO" && categoriasRestringidas.includes(categoria)) {
        throw new AppError(`No tienes permiso para registrar gastos de categoría: ${categoria}`, 403);
    }

    return await models.Gasto.create({
        negocioId,
        registradoPorId: usuarioId,
        cajaId: cajaAbierta.id,
        monto,
        categoria,
        descripcion
    });
};

export const obtenerGastos = async (negocioId, usuarioId, rol, queryParams = {}) => {
    const { limit, offset, page } = getPaginationParams(queryParams);
    const { categoria, fechaInicio, fechaFin, sortBy, sortOrder } = queryParams;

    const where = { negocioId };

    if (categoria) {
        where.categoria = categoria;
    }
    
    if (fechaInicio && fechaFin) {
        where.createdAt = {
            [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
        };
    } else if (fechaInicio) {
        where.createdAt = {
            [Op.gte]: new Date(fechaInicio)
        };
    } else if (fechaFin) {
        where.createdAt = {
            [Op.lte]: new Date(fechaFin)
        };
    }

    if (rol.toUpperCase() === "EMPLEADO") {
        const cajaAbierta = await models.Caja.findOne({ where: { negocioId, usuarioId, estado: "ABIERTA" } });
        if (!cajaAbierta) {
            return getPagingData({ count: 0, rows: [] }, page, limit);
        }
        where.cajaId = cajaAbierta.id;
    }

    let order = [["createdAt", "DESC"]];
    if (sortBy) {
        const direction = sortOrder && sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
        order = [[sortBy, direction]];
    }

    const data = await models.Gasto.findAndCountAll({
        where,
        order,
        limit,
        offset
    });

    return getPagingData(data, page, limit);
};
