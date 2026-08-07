import { AppError } from "../../utils/errors.js";
import { models } from "../../models/index.js";
import { emitToTenant } from "../../socket/socket.js";

// Función auxiliar para centralizar la lógica de cálculo
export function calcularMetricasCaja(caja) {
    let totalIngresos = 0;
    let totalEgresos = 0;
    let totalIngresosEfectivo = 0;
    let totalIngresosDigitales = 0;
    let totalEgresosEfectivo = 0;
    let totalEgresosDigitales = 0;
    let totalCreditosAplicados = 0;
    
    const metodoMap = {};

    caja.pagos?.forEach(p => {
        // Dinero físico/digital real que ingresó a la caja en este cobro
        const montoFisico = p.montoEfectivoTarjeta !== undefined && p.montoEfectivoTarjeta !== null
            ? parseFloat(p.montoEfectivoTarjeta)
            : parseFloat(p.monto);
        
        const montoCredito = p.montoCreditoAplicado !== undefined && p.montoCreditoAplicado !== null
            ? parseFloat(p.montoCreditoAplicado)
            : 0;

        totalIngresos += montoFisico;
        totalCreditosAplicados += montoCredito;
        
        if (montoFisico > 0) {
            const nombreMetodo = p.metodoPago?.nombre || "";
            const isEfectivo = !p.metodoPago || !nombreMetodo || nombreMetodo.toLowerCase().includes('efectivo');
            if (isEfectivo) {
                totalIngresosEfectivo += montoFisico;
            } else {
                totalIngresosDigitales += montoFisico;
            }
            
            if (p.metodoPago && p.metodoPago.id && nombreMetodo) {
                if (!metodoMap[p.metodoPagoId]) {
                    metodoMap[p.metodoPagoId] = { metodoPagoId: p.metodoPagoId, nombre: nombreMetodo, ingresos: 0, egresos: 0 };
                }
                metodoMap[p.metodoPagoId].ingresos += montoFisico;
            }
        }
    });

    caja.gastos?.forEach(g => {
        const monto = parseFloat(g.monto);
        totalEgresos += monto;
        
        // Si no tiene método de pago explícito (o contiene 'efectivo'), se asume egreso de efectivo físico de caja
        const nombreMetodo = g.metodoPago?.nombre || "";
        const isEfectivo = !g.metodoPago || !nombreMetodo || nombreMetodo.toLowerCase().includes('efectivo');
        if (isEfectivo) {
            totalEgresosEfectivo += monto;
        } else {
            totalEgresosDigitales += monto;
        }
        
        if (g.metodoPago && g.metodoPago.id && nombreMetodo) {
            if (!metodoMap[g.metodoPagoId]) {
                metodoMap[g.metodoPagoId] = { metodoPagoId: g.metodoPagoId, nombre: nombreMetodo, ingresos: 0, egresos: 0 };
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
        totalCreditosAplicados,
        totalesPorMetodo
    };
}

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
                include: [
                    { model: models.MetodoPago, as: "metodoPago" },
                    {
                        model: models.Pedido,
                        as: "pedido",
                        attributes: ["id", "codigoSeguimiento", "total", "estado", "fechaRecepcion"],
                        include: [
                            { model: models.Cliente, as: "cliente", attributes: ["id", "nombre", "telefono", "email"] }
                        ]
                    },
                    { model: models.Usuario, as: "registradoPor", attributes: ["id", "nombre", "email"] }
                ]
            },
            { 
                model: models.Gasto, 
                as: "gastos", 
                required: false,
                include: [
                    { model: models.MetodoPago, as: "metodoPago" },
                    { model: models.Usuario, as: "registradoPor", attributes: ["id", "nombre", "email"] }
                ]
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
