import { AppError } from "../../utils/errors.js";
import { models } from "../../models/index.js";
import { calcularMetricasCaja } from "./caja-core.service.js";

export const obtenerHistorialCajas = async (negocioId, usuarioId, rol, queryParams = {}) => {
    const where = { negocioId };

    // Si es empleado, solo ve sus propias cajas
    if (rol.toUpperCase() === "EMPLEADO") {
        where.usuarioId = usuarioId;
    }

    const { limit = 20, offset = 0 } = queryParams;

    const cajas = await models.Caja.findAndCountAll({
        where,
        limit,
        offset,
        order: [["fechaApertura", "DESC"]],
        include: [
            { model: models.Usuario, as: "cajero", attributes: ["id", "nombre", "email"] },
            { 
                model: models.Pago, 
                as: "pagos", 
                where: { estado: "COMPLETADO" }, 
                required: false,
                include: [{ model: models.MetodoPago, as: "metodoPago" }]
            },
            { 
                model: models.Gasto, 
                as: "gastos", 
                required: false,
                include: [{ model: models.MetodoPago, as: "metodoPago" }]
            }
        ],
        distinct: true // Important when using includes with limit/offset
    });

    return {
        total: cajas.count,
        items: cajas.rows.map(c => {
            const { totalIngresos, totalEgresos, totalIngresosEfectivo, totalEgresosEfectivo } = calcularMetricasCaja(c);
            const json = c.toJSON();
            json.usuario = json.cajero;
            delete json.cajero;
            
            json.totalIngresosEnVivo = totalIngresos;
            json.totalEgresosEnVivo = totalEgresos;
            json.totalIngresosEfectivo = totalIngresosEfectivo;
            json.totalEgresosEfectivo = totalEgresosEfectivo;
            json.efectivoEsperadoEnVivo = parseFloat(c.montoInicial || 0) + totalIngresosEfectivo - totalEgresosEfectivo;
            
            return json;
        })
    };
};

export const obtenerCajaPorId = async (negocioId, usuarioId, rol, cajaId) => {
    const where = { id: cajaId, negocioId };

    if (rol.toUpperCase() === "EMPLEADO") {
        where.usuarioId = usuarioId;
    }

    const caja = await models.Caja.findOne({
        where,
        include: [
            { model: models.Usuario, as: "cajero", attributes: ["id", "nombre", "email"] },
            { 
                model: models.Pago, 
                as: "pagos",
                include: [{ model: models.MetodoPago, as: "metodoPago" }]
            },
            { 
                model: models.Gasto, 
                as: "gastos",
                include: [{ model: models.MetodoPago, as: "metodoPago" }]
            }
        ]
    });

    if (!caja) {
        throw new AppError("Caja no encontrada o no tienes permisos para verla.", 404);
    }

    const {
        totalIngresos,
        totalEgresos,
        totalIngresosEfectivo,
        totalIngresosDigitales,
        totalEgresosEfectivo,
        totalEgresosDigitales,
        totalesPorMetodo
    } = calcularMetricasCaja(caja);

    const { Op } = await import("sequelize");
    const whereActividad = { usuarioId: caja.usuarioId };
    if (caja.fechaCierre) {
        whereActividad.createdAt = { [Op.between]: [caja.fechaApertura, caja.fechaCierre] };
    } else {
        whereActividad.createdAt = { [Op.gte]: caja.fechaApertura };
    }

    const actividadTurno = await models.HistorialPedido.findAll({
        where: whereActividad,
        order: [["createdAt", "DESC"]]
    });

    const json = caja.toJSON();
    json.usuario = json.cajero;
    delete json.cajero;

    json.totalIngresosEnVivo = totalIngresos;
    json.totalEgresosEnVivo = totalEgresos;
    json.totalIngresosEfectivo = totalIngresosEfectivo;
    json.totalIngresosDigitales = totalIngresosDigitales;
    json.totalEgresosEfectivo = totalEgresosEfectivo;
    json.totalEgresosDigitales = totalEgresosDigitales;
    json.totalesPorMetodo = totalesPorMetodo;
    json.actividadTurno = actividadTurno;

    return json;
};
