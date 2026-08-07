import { AppError } from "../../utils/errors.js";
import { models, sequelize } from "../../models/index.js";
import { emitToTenant } from "../../socket/socket.js";
import { generarFacturaPedido } from "../integraciones/afip.service.js";
import { connectionManager } from "../../models/connectionManager.js";
import { consumirCreditosFIFO, generarCreditoSobrepago } from "../clientes/credito.service.js";
import { Op } from "sequelize";

export const registrarPago = async (negocioId, usuarioId, data) => {
    let { 
        pedidoId, 
        metodoPagoId, 
        monto, 
        montoRecibido,
        montoEfectivo,
        aplicarSaldoAFavor = false, 
        montoSaldoAFavor = null, 
        dejarVueltoAFavor = false,
        facturarAfip = false 
    } = data;

    const t = await sequelize.transaction();

    try {
        const cajaAbierta = await models.Caja.findOne({ 
            where: { negocioId, usuarioId, estado: "ABIERTA" }, 
            transaction: t 
        });
        if (!cajaAbierta) {
            throw new AppError("No se puede cobrar pedidos sin abrir una caja.", 400);
        }

        const pedido = await models.Pedido.findOne({ 
            where: { id: pedidoId, negocioId }, 
            lock: t.LOCK.UPDATE,
            transaction: t 
        });
        if (!pedido) throw new AppError("Pedido no encontrado.", 404);
        if (pedido.estado === "CANCELADO") throw new AppError("No se puede cobrar un pedido cancelado.", 400);
        if (pedido.cobrado) throw new AppError("Este pedido ya está registrado como pagado.", 400);

        const totalPedido = parseFloat(pedido.total);
        let montoCreditoAplicado = 0;
        let aplicacionesCreditoGeneradas = [];

        // 1. Manejo de Saldo a Favor si fue solicitado
        if (aplicarSaldoAFavor) {
            const montoDeseado = montoSaldoAFavor ? Math.min(parseFloat(montoSaldoAFavor), totalPedido) : totalPedido;
            if (montoDeseado > 0) {
                // Primero creamos el pago temporal para tener el ID, o consumimos después
                // Para consistencia con FK pagoDestinoId, reservamos el consumo luego de crear el pago o usamos un ID
            }
        }

        let montoRestanteAPagar = totalPedido;
        let creditoConsumoData = null;

        if (aplicarSaldoAFavor) {
            const maxCredito = montoSaldoAFavor ? Math.min(parseFloat(montoSaldoAFavor), totalPedido) : totalPedido;
            if (maxCredito > 0) {
                // Pre-calculamos disponibilidad
                const creditosDisponibles = await models.CreditoCliente.findAll({
                    where: {
                        negocioId,
                        clienteId: pedido.clienteId,
                        estado: { [Op.in]: ["DISPONIBLE", "CONSUMIDO_PARCIAL"] },
                        montoDisponible: { [Op.gt]: 0 }
                    },
                    order: [["id", "ASC"]],
                    lock: t.LOCK.UPDATE,
                    transaction: t
                });

                let totalCreditoDisponible = creditosDisponibles.reduce((acc, c) => acc + parseFloat(c.montoDisponible), 0);
                let aCubrir = Math.min(totalCreditoDisponible, maxCredito);
                montoCreditoAplicado = Number(aCubrir.toFixed(2));
                montoRestanteAPagar = Number((totalPedido - montoCreditoAplicado).toFixed(2));
            }
        }

        // 2. Validación de fondos físicos (Efectivo / Tarjeta / Transferencia)
        const efectivoIngresado = parseFloat(montoRecibido ?? montoEfectivo ?? monto ?? 0);
        let montoEfectivoParaCaja = 0;
        let vueltoGenerado = 0;

        if (montoRestanteAPagar > 0) {
            if (!metodoPagoId) {
                const efectivo = await models.MetodoPago.findOne({ 
                    where: { negocioId, nombre: { [Op.iLike]: "%efectivo%" }, activo: true }, 
                    transaction: t 
                });
                if (!efectivo) throw new AppError("Debe especificar un método de pago.", 400);
                metodoPagoId = efectivo.id;
            }

            const metodoPago = await models.MetodoPago.findByPk(metodoPagoId, { transaction: t });
            const esEfectivo = metodoPago && metodoPago.nombre.toLowerCase().includes("efectivo");

            if (efectivoIngresado < montoRestanteAPagar) {
                throw new AppError(
                    `El monto ingresado ($${efectivoIngresado}) no cubre el saldo restante del pedido ($${montoRestanteAPagar}).`, 
                    400
                );
            }

            if (efectivoIngresado > montoRestanteAPagar && !esEfectivo) {
                throw new AppError("Solo se permite abonar de más si el método de pago es Efectivo.", 400);
            }

            if (efectivoIngresado > montoRestanteAPagar && esEfectivo) {
                vueltoGenerado = Number((efectivoIngresado - montoRestanteAPagar).toFixed(2));
                if (dejarVueltoAFavor) {
                    montoEfectivoParaCaja = efectivoIngresado; // Todo el billete entra a la caja física
                } else {
                    montoEfectivoParaCaja = montoRestanteAPagar; // El vuelto se retiró en mano
                }
            } else {
                montoEfectivoParaCaja = montoRestanteAPagar;
            }
        }

        // 3. Crear Registro de Pago
        const nuevoPago = await models.Pago.create({
            pedidoId,
            registradoPorId: usuarioId,
            metodoPagoId: montoRestanteAPagar > 0 ? metodoPagoId : null,
            cajaId: cajaAbierta.id,
            monto: totalPedido,
            montoEfectivoTarjeta: montoEfectivoParaCaja,
            montoCreditoAplicado: montoCreditoAplicado,
            montoAFavorGenerado: (dejarVueltoAFavor && vueltoGenerado > 0) ? vueltoGenerado : 0,
            saldoAFavorDisponible: 0,
            estado: "COMPLETADO"
        }, { transaction: t });

        // 4. Consumir créditos aplicando el ID del Pago recién creado
        if (montoCreditoAplicado > 0) {
            await consumirCreditosFIFO(
                negocioId,
                pedido.clienteId,
                montoCreditoAplicado,
                nuevoPago.id,
                pedido.id,
                t
            );
        }

        // 5. Si se dejó vuelto a favor, generar el nuevo CreditoCliente
        if (dejarVueltoAFavor && vueltoGenerado > 0) {
            await generarCreditoSobrepago(
                negocioId,
                pedido.clienteId,
                pedido.id,
                vueltoGenerado,
                usuarioId,
                t
            );
        }

        // 6. Actualizar Pedido a cobrado
        await pedido.update({ cobrado: true }, { transaction: t });

        // 7. Facturación AFIP si corresponde
        try {
            const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
            const config = await ConfiguracionNegocio.findOne({ where: { negocioId }, transaction: t });
            let debeFacturar = false;
            
            if (config && config.afipActivo && config.afipCertificado && config.afipLlavePrivada) {
                if (config.afipModoFacturacion === "AUTOMATICO") {
                    debeFacturar = true;
                } else if (config.afipModoFacturacion === "MANUAL" && facturarAfip === true) {
                    debeFacturar = true;
                }
            }
            
            if (debeFacturar) {
                const afipData = await generarFacturaPedido(negocioId, pedido, null, nuevoPago);
                await nuevoPago.update({
                    cae: afipData.cae,
                    vencimientoCae: afipData.vencimientoCae,
                    nroComprobante: afipData.nroComprobante.toString(),
                    tipoComprobante: afipData.tipoComprobante
                }, { transaction: t });
            }
        } catch (afipError) {
            console.error("⚠️ El pago se registró pero falló la facturación de AFIP:", afipError.message);
        }

        await t.commit();

        emitToTenant(negocioId, "pago_registrado", {
            pagoId: nuevoPago.id,
            pedidoId: pedido.id,
            monto: totalPedido,
            montoEfectivoTarjeta: montoEfectivoParaCaja,
            montoCreditoAplicado
        });
        
        emitToTenant(negocioId, "pedido_actualizado", {
            action: "UPDATE_STATUS",
            pedidoId: pedido.id,
            cobrado: true
        });

        return nuevoPago;
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

/**
 * Liquidación masiva o individual de pedidos adeudados de un cliente.
 * Garantiza 1 Pago individual para cada Pedido liquidado bajo una sola transacción ACID.
 */
export const cobrarDeudaMasiva = async (negocioId, usuarioId, data) => {
    const { 
        clienteId, 
        pedidosIds, 
        pedidos, 
        metodoPagoId, 
        montoRecibido, 
        aplicarSaldoAFavor = false, 
        dejarVueltoAFavor = false 
    } = data;

    const t = await sequelize.transaction();

    try {
        const cajaAbierta = await models.Caja.findOne({ 
            where: { negocioId, usuarioId, estado: "ABIERTA" }, 
            transaction: t 
        });
        if (!cajaAbierta) {
            throw new AppError("No se puede cobrar deudas sin abrir una caja.", 400);
        }

        const ids = pedidosIds || (pedidos ? pedidos.map(p => p.pedidoId || p.id) : []);
        if (!ids || ids.length === 0) {
            throw new AppError("Debe seleccionar al menos un pedido para cobrar la deuda.", 400);
        }

        // Bloqueo pesimista sobre todos los pedidos adeudados seleccionados
        const pedidosDb = await models.Pedido.findAll({
            where: {
                id: { [Op.in]: ids },
                negocioId,
                clienteId,
                cobrado: false
            },
            order: [["fechaRecepcion", "ASC"]],
            lock: t.LOCK.UPDATE,
            transaction: t
        });

        if (pedidosDb.length !== ids.length) {
            throw new AppError("Uno o más pedidos seleccionados no existen, ya fueron cobrados o no pertenecen a este cliente.", 400);
        }

        const deudaTotal = pedidosDb.reduce((acc, p) => acc + parseFloat(p.total), 0);

        // 1. Créditos a favor disponibles si se aplican
        let creditoRestanteDisponible = 0;
        if (aplicarSaldoAFavor) {
            const creditos = await models.CreditoCliente.findAll({
                where: {
                    negocioId,
                    clienteId,
                    estado: { [Op.in]: ["DISPONIBLE", "CONSUMIDO_PARCIAL"] },
                    montoDisponible: { [Op.gt]: 0 }
                },
                order: [["id", "ASC"]],
                lock: t.LOCK.UPDATE,
                transaction: t
            });
            creditoRestanteDisponible = creditos.reduce((acc, c) => acc + parseFloat(c.montoDisponible), 0);
        }

        let efectivoDisponible = parseFloat(montoRecibido || 0);
        const fondosTotalesDisponibles = Number((creditoRestanteDisponible + efectivoDisponible).toFixed(2));

        if (fondosTotalesDisponibles < deudaTotal) {
            throw new AppError(
                `Fondos insuficientes para saldar los pedidos seleccionados. Total requerido: $${deudaTotal.toFixed(2)}, Fondos provistos: $${fondosTotalesDisponibles.toFixed(2)}.`,
                400
            );
        }

        const pagosCreados = [];

        // 2. Liquidación pedido a pedido (1 Pago -> 1 Pedido)
        for (const pedido of pedidosDb) {
            const totalPedido = parseFloat(pedido.total);
            let creditoParaEstePedido = 0;
            let efectivoParaEstePedido = 0;

            if (creditoRestanteDisponible > 0) {
                creditoParaEstePedido = Math.min(creditoRestanteDisponible, totalPedido);
                creditoRestanteDisponible = Number((creditoRestanteDisponible - creditoParaEstePedido).toFixed(2));
            }

            const remanentePedido = Number((totalPedido - creditoParaEstePedido).toFixed(2));
            if (remanentePedido > 0) {
                efectivoParaEstePedido = remanentePedido;
                efectivoDisponible = Number((efectivoDisponible - efectivoParaEstePedido).toFixed(2));
            }

            const nuevoPago = await models.Pago.create({
                pedidoId: pedido.id,
                registradoPorId: usuarioId,
                metodoPagoId: efectivoParaEstePedido > 0 ? metodoPagoId : null,
                cajaId: cajaAbierta.id,
                monto: totalPedido,
                montoEfectivoTarjeta: efectivoParaEstePedido,
                montoCreditoAplicado: creditoParaEstePedido,
                montoAFavorGenerado: 0,
                saldoAFavorDisponible: 0,
                estado: "COMPLETADO"
            }, { transaction: t });

            if (creditoParaEstePedido > 0) {
                await consumirCreditosFIFO(
                    negocioId,
                    clienteId,
                    creditoParaEstePedido,
                    nuevoPago.id,
                    pedido.id,
                    t
                );
            }

            await pedido.update({ cobrado: true }, { transaction: t });
            pagosCreados.push(nuevoPago);
        }

        // 3. Sobrante de efectivo si se solicitó dejar como saldo a favor
        if (dejarVueltoAFavor && efectivoDisponible > 0) {
            await generarCreditoSobrepago(
                negocioId,
                clienteId,
                pedidosDb[0].id,
                efectivoDisponible,
                usuarioId,
                t
            );
        }

        await t.commit();

        // Emisión de WebSockets para cada pedido liquidado
        pagosCreados.forEach(p => {
            emitToTenant(negocioId, "pago_registrado", {
                pagoId: p.id,
                pedidoId: p.pedidoId,
                monto: p.monto
            });
            emitToTenant(negocioId, "pedido_actualizado", {
                action: "UPDATE_STATUS",
                pedidoId: p.pedidoId,
                cobrado: true
            });
        });

        return {
            totalLiquidado: deudaTotal,
            pedidosSaldadosCount: pedidosDb.length,
            pagos: pagosCreados,
            vueltoGeneradoAFavor: (dejarVueltoAFavor && efectivoDisponible > 0) ? efectivoDisponible : 0
        };
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

export const anularPago = async (negocioId, usuarioId, pagoId) => {
    const t = await sequelize.transaction();
    try {
        const cajaAbierta = await models.Caja.findOne({ where: { negocioId, usuarioId, estado: "ABIERTA" }, transaction: t });
        if (!cajaAbierta) {
            throw new AppError("No se puede anular pagos. Debe abrir una caja.", 400);
        }

        const pago = await models.Pago.findOne({ where: { id: pagoId }, include: [{ model: models.Pedido, as: "pedido" }], transaction: t });
        if (!pago || pago.pedido.negocioId !== negocioId) {
            throw new AppError("Pago no encontrado.", 404);
        }

        if (pago.estado === "ANULADO") {
            throw new AppError("El pago ya está anulado.", 400);
        }

        await pago.update({ estado: "ANULADO" }, { transaction: t });
        await pago.pedido.update({ cobrado: false }, { transaction: t });

        await t.commit();

        emitToTenant(negocioId, "pago_actualizado", {
            pagoId: pago.id,
            estado: "ANULADO"
        });

        return pago;
    } catch (error) {
        await t.rollback();
        throw error;
    }
};
