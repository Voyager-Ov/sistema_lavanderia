import { AppError } from "../../utils/errors.js";
import { models } from "../../models/index.js";
import { emitToTenant } from "../../socket/socket.js";

export const abrirCaja = async (negocioId, usuarioId, montoInicial) => {
    // Verificar si ya tiene una abierta
    const cajaAbierta = await models.Caja.findOne({ where: { negocioId, usuarioId, estado: "ABIERTA" } });
    if (cajaAbierta) {
        throw new AppError("No se puede abrir otra caja. Ya tienes una caja abierta.", 400);
    }

    const nuevaCaja = await models.Caja.create({
        negocioId,
        usuarioId,
        montoInicial: montoInicial || 0,
        estado: "ABIERTA"
    });

    emitToTenant(negocioId, "caja_actualizada", { message: "Caja abierta" });

    return nuevaCaja;
};

export const obtenerCajaActual = async (negocioId, usuarioId) => {
    const cajaAbierta = await models.Caja.findOne({
        where: { negocioId, usuarioId, estado: "ABIERTA" },
        include: [
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
        ]
    });

    if (!cajaAbierta) {
        return null;
    }

    const {
        totalIngresos,
        totalEgresos,
        totalIngresosEfectivo,
        totalIngresosDigitales,
        totalEgresosEfectivo,
        totalEgresosDigitales,
        totalesPorMetodo
    } = calcularMetricasCaja(cajaAbierta);

    const { Op } = await import("sequelize");
    const actividadTurno = await models.HistorialPedido.findAll({
        where: {
            usuarioId,
            createdAt: { [Op.gte]: cajaAbierta.fechaApertura }
        },
        order: [["createdAt", "DESC"]]
    });

    const ultimaCaja = await models.Caja.findOne({
        where: { negocioId, usuarioId, estado: "CERRADA" },
        order: [["fechaCierre", "DESC"]]
    });

    const cantidadTurnos = await models.Caja.count({
        where: { negocioId, usuarioId }
    });

    const cajaJSON = cajaAbierta.toJSON();
    cajaJSON.totalIngresosEnVivo = totalIngresos;
    cajaJSON.totalEgresosEnVivo = totalEgresos;
    cajaJSON.totalIngresosEfectivo = totalIngresosEfectivo;
    cajaJSON.totalIngresosDigitales = totalIngresosDigitales;
    cajaJSON.totalEgresosEfectivo = totalEgresosEfectivo;
    cajaJSON.totalEgresosDigitales = totalEgresosDigitales;
    cajaJSON.efectivoEsperadoEnVivo = parseFloat(cajaAbierta.montoInicial) + totalIngresosEfectivo - totalEgresosEfectivo;
    cajaJSON.totalesPorMetodo = totalesPorMetodo;
    cajaJSON.actividadTurno = actividadTurno;
    cajaJSON.ultimaCajaCerrada = ultimaCaja ? ultimaCaja.toJSON() : null;
    cajaJSON.cantidadTurnos = cantidadTurnos;

    return cajaJSON;
};

export const cerrarCaja = async (negocioId, usuarioId, cajaId, efectivoReal) => {
    const caja = await models.Caja.findOne({
        where: { id: cajaId, negocioId, usuarioId, estado: "ABIERTA" },
        include: [
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
        ]
    });

    if (!caja) {
        throw new AppError("Caja no encontrada o ya está cerrada.", 404);
    }

    const {
        totalIngresosEfectivo,
        totalEgresosEfectivo
    } = calcularMetricasCaja(caja);

    const efectivoEsperado = parseFloat(caja.montoInicial) + totalIngresosEfectivo - totalEgresosEfectivo;
    const diferencia = parseFloat(efectivoReal) - efectivoEsperado;

    await caja.update({
        estado: "CERRADA",
        fechaCierre: new Date(),
        totalIngresosEfectivo,
        totalEgresosEfectivo,
        efectivoEsperado,
        efectivoReal,
        diferenciaEfectivo: diferencia
    });

    emitToTenant(negocioId, "caja_actualizada", { message: "Caja cerrada" });

    return caja;
};

// Función auxiliar para centralizar la lógica de cálculo
function calcularMetricasCaja(caja) {
    let totalIngresos = 0;
    let totalEgresos = 0;
    let totalIngresosEfectivo = 0;
    let totalIngresosDigitales = 0;
    let totalEgresosEfectivo = 0;
    let totalEgresosDigitales = 0;
    
    const metodoMap = {};

    caja.pagos?.forEach(p => {
        const monto = parseFloat(p.monto);
        totalIngresos += monto;
        
        // Verifica si es efectivo (ej: "Efectivo" o id fijo que suele ser Efectivo, o si metodos_pago tuviera un flag esFijo, acá usamos nombre)
        const isEfectivo = p.metodoPago && p.metodoPago.nombre.toLowerCase().includes('efectivo');
        if (isEfectivo) {
            totalIngresosEfectivo += monto;
        } else {
            totalIngresosDigitales += monto;
        }
        
        if (p.metodoPago) {
            if (!metodoMap[p.metodoPagoId]) {
                metodoMap[p.metodoPagoId] = { metodoPagoId: p.metodoPagoId, nombre: p.metodoPago.nombre, ingresos: 0, egresos: 0 };
            }
            metodoMap[p.metodoPagoId].ingresos += monto;
        }
    });

    caja.gastos?.forEach(g => {
        const monto = parseFloat(g.monto);
        totalEgresos += monto;
        
        const isEfectivo = g.metodoPago && g.metodoPago.nombre.toLowerCase().includes('efectivo');
        if (isEfectivo) {
            totalEgresosEfectivo += monto;
        } else {
            totalEgresosDigitales += monto;
        }
        
        if (g.metodoPago) {
            if (!metodoMap[g.metodoPagoId]) {
                metodoMap[g.metodoPagoId] = { metodoPagoId: g.metodoPagoId, nombre: g.metodoPago.nombre, ingresos: 0, egresos: 0 };
            }
            metodoMap[g.metodoPagoId].egresos += monto;
        }
    });

    const totalesPorMetodo = Object.values(metodoMap);

    return {
        totalIngresos,
        totalEgresos,
        totalIngresosEfectivo,
        totalIngresosDigitales,
        totalEgresosEfectivo,
        totalEgresosDigitales,
        totalesPorMetodo
    };
}

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
