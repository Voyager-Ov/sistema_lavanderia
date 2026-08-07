import { models, sequelize } from "../../models/index.js";
import { AppError } from "../../utils/errors.js";
import { Op } from "sequelize";

/**
 * Servicio contable de Cuenta Corriente y Libro Mayor en tiempo real.
 * Realiza cálculos determinísticos y dinámicos sin estados mutables desincronizables.
 */

/**
 * Obtiene la posición financiera consolidada y en vivo de un cliente.
 */
export const obtenerEstadoCuenta = async (negocioId, clienteId) => {
    const cliente = await models.Cliente.findOne({
        where: { id: clienteId, negocioId },
        attributes: ["id", "nombre", "telefono", "email", "activo"]
    });

    if (!cliente) {
        throw new AppError("Cliente no encontrado.", 404);
    }

    // 1. Pedidos ENTREGADOS pendientes de cobro (Deuda Exigible)
    const pedidosDeuda = await models.Pedido.findAll({
        where: {
            negocioId,
            clienteId,
            estado: "ENTREGADO",
            cobrado: false
        },
        include: [
            {
                model: models.PedidoItem,
                as: "items",
                include: [{ model: models.Producto, as: "producto", attributes: ["nombre"] }]
            }
        ],
        order: [["fechaRecepcion", "ASC"]]
    });

    // 2. Pedidos en proceso no cobrados (Deuda No Exigible / En curso)
    const pedidosEnCurso = await models.Pedido.findAll({
        where: {
            negocioId,
            clienteId,
            estado: {
                [Op.in]: ["PENDIENTE", "EN_PROCESO", "LISTO_PARA_RETIRAR"]
            },
            cobrado: false
        },
        order: [["fechaRecepcion", "ASC"]]
    });

    // 3. Créditos a favor disponibles
    const creditosDisponibles = await models.CreditoCliente.findAll({
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
        include: [
            {
                model: models.Pedido,
                as: "pedidoOrigen",
                attributes: ["id", "codigoSeguimiento", "total", "createdAt"]
            }
        ],
        order: [["id", "ASC"]]
    });

    // Cálculos de sumatorias en vivo
    const deudaExigible = pedidosDeuda.reduce((acc, p) => Number((acc + parseFloat(p.total)).toFixed(2)), 0);
    const deudaNoExigible = pedidosEnCurso.reduce((acc, p) => Number((acc + parseFloat(p.total)).toFixed(2)), 0);
    const totalCreditoDisponible = creditosDisponibles.reduce((acc, c) => Number((acc + parseFloat(c.montoDisponible)).toFixed(2)), 0);
    
    // Saldo neto: Positivo significa saldo a favor neto; Negativo significa deuda exigible neta
    const saldoNeto = Number((totalCreditoDisponible - deudaExigible).toFixed(2));

    return {
        cliente,
        resumen: {
            deudaExigible,
            deudaNoExigible,
            totalCreditoDisponible,
            saldoNeto,
            pedidosDeudaCount: pedidosDeuda.length,
            pedidosEnCursoCount: pedidosEnCurso.length,
            creditosCount: creditosDisponibles.length
        },
        pedidosDeuda,
        pedidosEnCurso,
        creditosDisponibles
    };
};

/**
 * Obtiene exclusivamente la lista de créditos con montoDisponible > 0 listos para aplicar en cobro.
 */
export const obtenerCreditosDisponibles = async (negocioId, clienteId) => {
    return await models.CreditoCliente.findAll({
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
        include: [
            {
                model: models.Pedido,
                as: "pedidoOrigen",
                attributes: ["id", "codigoSeguimiento", "total", "createdAt"]
            }
        ],
        order: [["id", "ASC"]]
    });
};

/**
 * Obtiene el extracto unificado de movimientos cronológicos (Libro Mayor del Cliente).
 */
export const obtenerMovimientosCuenta = async (negocioId, clienteId, { page = 1, limit = 20, desde, hasta } = {}) => {
    const cliente = await models.Cliente.findOne({
        where: { id: clienteId, negocioId }
    });

    if (!cliente) {
        throw new AppError("Cliente no encontrado.", 404);
    }

    const whereFechas = {};
    if (desde && hasta) {
        whereFechas.createdAt = {
            [Op.between]: [new Date(desde), new Date(hasta)]
        };
    } else if (desde) {
        whereFechas.createdAt = { [Op.gte]: new Date(desde) };
    } else if (hasta) {
        whereFechas.createdAt = { [Op.lte]: new Date(hasta) };
    }

    // A. Pedidos Entregados (Cargos / Deuda generada)
    const pedidos = await models.Pedido.findAll({
        where: {
            negocioId,
            clienteId,
            estado: { [Op.ne]: "CANCELADO" },
            ...whereFechas
        },
        attributes: ["id", "codigoSeguimiento", "total", "estado", "cobrado", "fechaRecepcion", "createdAt"]
    });

    // B. Pagos realizados
    const pagos = await models.Pago.findAll({
        where: {
            estado: "COMPLETADO",
            ...whereFechas
        },
        include: [
            {
                model: models.Pedido,
                as: "pedido",
                where: { negocioId, clienteId },
                attributes: ["id", "codigoSeguimiento"]
            },
            {
                model: models.MetodoPago,
                as: "metodoPago",
                attributes: ["id", "nombre"]
            }
        ]
    });

    // C. Créditos a favor generados
    const creditos = await models.CreditoCliente.findAll({
        where: {
            negocioId,
            clienteId,
            ...whereFechas
        },
        include: [
            {
                model: models.Pedido,
                as: "pedidoOrigen",
                attributes: ["id", "codigoSeguimiento"]
            }
        ]
    });

    // D. Aplicaciones de crédito
    const aplicaciones = await models.AplicacionCredito.findAll({
        where: {
            negocioId,
            ...whereFechas
        },
        include: [
            {
                model: models.CreditoCliente,
                as: "credito",
                where: { clienteId },
                attributes: ["id", "tipoOrigen"]
            },
            {
                model: models.Pedido,
                as: "pedidoDestino",
                attributes: ["id", "codigoSeguimiento"]
            }
        ]
    });

    // Unificar todos los movimientos en un timeline ordenado
    const movimientos = [];

    pedidos.forEach(p => {
        const desc = `Servicio Lavandería - Pedido #${p.codigoSeguimiento} (${p.estado})`;
        movimientos.push({
            id: `pedido-${p.id}`,
            tipo: "CARGO_PEDIDO",
            fecha: p.createdAt,
            pedidoId: p.id,
            codigoSeguimiento: p.codigoSeguimiento,
            concepto: desc,
            descripcion: desc,
            monto: parseFloat(p.total),
            impacto: "DEBE",
            cobrado: p.cobrado,
            metodoPago: "-"
        });
    });

    pagos.forEach(p => {
        const metodoNombre = p.metodoPago?.nombre || (parseFloat(p.montoCreditoAplicado || 0) > 0 && parseFloat(p.montoEfectivoTarjeta || 0) === 0 ? "Saldo a Favor" : "Fondos Mixtos");
        const desc = `Pago Pedido #${p.pedido?.codigoSeguimiento || p.pedidoId} (${metodoNombre})`;
        movimientos.push({
            id: `pago-${p.id}`,
            tipo: "PAGO_RECIBIDO",
            fecha: p.createdAt,
            pagoId: p.id,
            pedidoId: p.pedido?.id,
            codigoSeguimiento: p.pedido?.codigoSeguimiento,
            concepto: desc,
            descripcion: desc,
            monto: parseFloat(p.monto),
            montoEfectivo: parseFloat(p.montoEfectivoTarjeta || 0),
            montoCredito: parseFloat(p.montoCreditoAplicado || 0),
            metodoPago: metodoNombre,
            impacto: "HABER"
        });
    });

    creditos.forEach(c => {
        const desc = `Saldo a Favor Generado (${c.tipoOrigen}) - ${c.motivo || ''}`;
        movimientos.push({
            id: `credito-${c.id}`,
            tipo: "CREDITO_GENERADO",
            fecha: c.createdAt,
            creditoId: c.id,
            pedidoOrigenId: c.pedidoOrigenId,
            codigoSeguimiento: c.pedidoOrigen?.codigoSeguimiento,
            concepto: desc,
            descripcion: desc,
            monto: parseFloat(c.montoOriginal),
            montoDisponible: parseFloat(c.montoDisponible),
            metodoPago: "Crédito a Favor",
            impacto: "HABER"
        });
    });

    // Ordenar cronológicamente descendente
    movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Paginación en memoria
    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 20;
    const offset = (parsedPage - 1) * parsedLimit;
    const paginatedItems = movimientos.slice(offset, offset + parsedLimit);

    return {
        items: paginatedItems,
        meta: {
            total: movimientos.length,
            totalItems: movimientos.length,
            page: parsedPage,
            currentPage: parsedPage,
            limit: parsedLimit,
            totalPages: Math.ceil(movimientos.length / parsedLimit) || 1
        }
    };
};
