import { models } from "../../models/index.js";
import { AppError } from "../../utils/errors.js";
import { Op } from "sequelize";

/**
 * Servicio especializado en el ciclo de vida y consumo de créditos a favor.
 * Implementa concurrencia segura con Bloqueo Pesimista (SELECT ... FOR UPDATE).
 */

/**
 * Consume créditos a favor de un cliente usando estrategia FIFO (First In, First Out).
 * 
 * @param {number} negocioId 
 * @param {number} clienteId 
 * @param {number} montoACubrir - Monto total de crédito que se desea aplicar
 * @param {number} pagoDestinoId - ID del pago que recibe la cobertura
 * @param {number} pedidoDestinoId - ID del pedido que se está abonando
 * @param {object} transaction - Transacción Sequelize activa
 * @returns {Promise<{totalAplicado: number, aplicaciones: Array}>}
 */
export const consumirCreditosFIFO = async (
    negocioId,
    clienteId,
    montoACubrir,
    pagoDestinoId,
    pedidoDestinoId,
    transaction
) => {
    if (!transaction) {
        throw new AppError("Se requiere una transacción activa para el consumo seguro de créditos.", 500);
    }

    const montoObjetivo = parseFloat(montoACubrir);
    if (isNaN(montoObjetivo) || montoObjetivo <= 0) {
        throw new AppError("El monto a cubrir con saldo a favor debe ser mayor a 0.", 400);
    }

    // 1. Bloqueo pesimista (FOR UPDATE) sobre los créditos disponibles del cliente en orden FIFO
    const creditos = await models.CreditoCliente.findAll({
        where: {
            negocioId,
            clienteId,
            estado: {
                [Op.in]: ["DISPONIBLE", "CONSUMIDO_PARCIAL"]
            },
            montoDisponible: {
                [Op.gt]: 0
            }
        },
        order: [["id", "ASC"]], // FIFO: Los más antiguos primero
        lock: transaction.LOCK.UPDATE,
        transaction
    });

    let montoRestante = montoObjetivo;
    let totalAplicado = 0;
    const aplicaciones = [];

    for (const credito of creditos) {
        if (montoRestante <= 0) break;

        const disponible = parseFloat(credito.montoDisponible);
        const aAplicar = Math.min(disponible, montoRestante);

        const nuevoDisponible = Number((disponible - aAplicar).toFixed(2));
        const nuevoEstado = nuevoDisponible === 0 ? "CONSUMIDO_TOTAL" : "CONSUMIDO_PARCIAL";

        // Actualizar crédito
        await credito.update({
            montoDisponible: nuevoDisponible,
            estado: nuevoEstado
        }, { transaction });

        // Crear registro inmutable de aplicación
        const aplicacion = await models.AplicacionCredito.create({
            negocioId,
            creditoId: credito.id,
            pagoDestinoId,
            pedidoDestinoId,
            montoAplicado: aAplicar
        }, { transaction });

        aplicaciones.push(aplicacion);

        montoRestante = Number((montoRestante - aAplicar).toFixed(2));
        totalAplicado = Number((totalAplicado + aAplicar).toFixed(2));
    }

    if (totalAplicado < montoObjetivo) {
        throw new AppError(
            `Saldo a favor insuficiente. Disponible: $${totalAplicado.toFixed(2)}, Solicitado: $${montoObjetivo.toFixed(2)}.`,
            400
        );
    }

    return {
        totalAplicado,
        aplicaciones
    };
};

/**
 * Genera un nuevo crédito a favor por sobrepago/vuelto en efectivo.
 */
export const generarCreditoSobrepago = async (
    negocioId,
    clienteId,
    pedidoOrigenId,
    monto,
    usuarioId,
    transaction
) => {
    const montoFloat = parseFloat(monto);
    if (isNaN(montoFloat) || montoFloat <= 0) {
        throw new AppError("El monto del crédito por sobrepago debe ser mayor a 0.", 400);
    }

    return await models.CreditoCliente.create({
        negocioId,
        clienteId,
        pedidoOrigenId,
        montoOriginal: montoFloat,
        montoDisponible: montoFloat,
        tipoOrigen: "SOBREPAGO_EFECTIVO",
        estado: "DISPONIBLE",
        motivo: `Vuelto de sobrepago en Pedido #${pedidoOrigenId}`,
        creadoPorId: usuarioId
    }, { transaction });
};

/**
 * Genera un nuevo crédito a favor por cancelación de pedido cobrado.
 */
export const generarCreditoCancelacion = async (
    negocioId,
    clienteId,
    pedidoOrigenId,
    monto,
    usuarioId,
    transaction
) => {
    const montoFloat = parseFloat(monto);
    if (isNaN(montoFloat) || montoFloat <= 0) {
        throw new AppError("El monto del crédito por cancelación debe ser mayor a 0.", 400);
    }

    return await models.CreditoCliente.create({
        negocioId,
        clienteId,
        pedidoOrigenId,
        montoOriginal: montoFloat,
        montoDisponible: montoFloat,
        tipoOrigen: "CANCELACION_PEDIDO",
        estado: "DISPONIBLE",
        motivo: `Reintegro a favor por cancelación del Pedido #${pedidoOrigenId}`,
        creadoPorId: usuarioId
    }, { transaction });
};

/**
 * Genera un ajuste manual de crédito emitido por un administrador.
 */
export const generarCreditoAjusteManual = async (
    negocioId,
    clienteId,
    monto,
    motivo,
    usuarioId,
    transaction
) => {
    const montoFloat = parseFloat(monto);
    if (isNaN(montoFloat) || montoFloat <= 0) {
        throw new AppError("El monto del ajuste manual debe ser mayor a 0.", 400);
    }
    if (!motivo || motivo.trim().length < 5) {
        throw new AppError("Debe especificar un motivo válido de al menos 5 caracteres para el ajuste manual.", 400);
    }

    return await models.CreditoCliente.create({
        negocioId,
        clienteId,
        pedidoOrigenId: null,
        montoOriginal: montoFloat,
        montoDisponible: montoFloat,
        tipoOrigen: "AJUSTE_MANUAL",
        estado: "DISPONIBLE",
        motivo: motivo.trim(),
        creadoPorId: usuarioId
    }, { transaction });
};
