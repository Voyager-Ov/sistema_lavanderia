import { AppError } from "../../utils/errors.js";
import { models, sequelize } from "../../models/index.js";
import { emitToTenant } from "../../socket/socket.js";
import { generarFacturaPedido } from "../integraciones/afip.service.js";
import { connectionManager } from "../../models/connectionManager.js";

export const registrarPago = async (negocioId, usuarioId, data) => {
    let { pedidoId, metodoPagoId, monto, dejarVueltoAFavor = false, saldosAplicados = [], usarSaldoGlobal = false } = data;
    const t = await sequelize.transaction();

    try {
        if (!metodoPagoId) {
            const efectivo = await models.MetodoPago.findOne({ where: { negocioId, nombre: { [sequelize.Op.iLike]: "%efectivo%" }, activo: true }, transaction: t });
            if (!efectivo) throw new AppError("Debe especificar un método de pago o habilitar 'Efectivo'.", 400);
            metodoPagoId = efectivo.id;
        }

        const metodoPago = await models.MetodoPago.findByPk(metodoPagoId, { transaction: t });
        const esEfectivo = metodoPago && metodoPago.nombre.toLowerCase().includes("efectivo");

        const cajaAbierta = await models.Caja.findOne({ where: { negocioId, usuarioId, estado: "ABIERTA" }, transaction: t });
        if (!cajaAbierta) {
            throw new AppError("No se puede cobrar pedidos sin abrir una caja.", 400);
        }

        const pedido = await models.Pedido.findOne({ where: { id: pedidoId, negocioId }, transaction: t });
        if (!pedido) throw new AppError("Pedido no encontrado.", 404);
        if (pedido.estado === "CANCELADO") throw new AppError("No se puede cobrar un pedido cancelado.", 400);
        if (pedido.cobrado) throw new AppError("Este pedido ya está registrado como pagado.", 400);

        let totalSaldosAplicados = 0;

        if (saldosAplicados && saldosAplicados.length > 0) {
            for (const saldo of saldosAplicados) {
                const pagoOrigen = await models.Pago.findOne({ 
                    where: { id: saldo.pagoId, estado: "COMPLETADO" },
                    include: [{ model: models.Pedido, as: "pedido" }],
                    transaction: t 
                });
                
                if (!pagoOrigen || parseFloat(pagoOrigen.saldoAFavorDisponible) < parseFloat(saldo.monto)) {
                    throw new AppError(`Saldo a favor insuficiente en el pago #${saldo.pagoId}.`, 400);
                }

                // Descontar saldo disponible
                const nuevoDisponible = parseFloat(pagoOrigen.saldoAFavorDisponible) - parseFloat(saldo.monto);
                await pagoOrigen.update({ saldoAFavorDisponible: nuevoDisponible }, { transaction: t });

                // Registrar en Movimientos como historial
                await models.MovimientoCuentaCorriente.create({
                    clienteId: pedido.clienteId,
                    negocioId,
                    pedidoId: pedido.id,
                    tipoMovimiento: "CREDITO",
                    monto: parseFloat(saldo.monto),
                    saldoResultante: 0, 
                    comentario: `Saldo a favor aplicado desde el Pedido #${pagoOrigen.pedido?.codigoSeguimiento || pagoOrigen.pedidoId}`
                }, { transaction: t });

                totalSaldosAplicados += parseFloat(saldo.monto);
            }
        }

        const totalPedido = parseFloat(pedido.total);
        let montoAUsarGlobal = 0;

        if (usarSaldoGlobal) {
            const clienteParaSaldo = await models.Cliente.findOne({ where: { id: pedido.clienteId, negocioId }, transaction: t });
            if (clienteParaSaldo) {
                const saldoGlobalActual = parseFloat(clienteParaSaldo.saldoCuentaCorriente || 0);
                if (saldoGlobalActual < 0) {
                    const saldoGlobalFavor = Math.abs(saldoGlobalActual);
                    const faltaPagar = totalPedido - totalSaldosAplicados;
                    
                    if (faltaPagar > 0) {
                        montoAUsarGlobal = Math.min(saldoGlobalFavor, faltaPagar);
                        totalSaldosAplicados += montoAUsarGlobal;

                        // Registrar movimiento del uso del saldo global
                        await models.MovimientoCuentaCorriente.create({
                            clienteId: pedido.clienteId,
                            negocioId,
                            pedidoId: pedido.id,
                            tipoMovimiento: "CREDITO",
                            monto: montoAUsarGlobal,
                            saldoResultante: 0, 
                            comentario: `Saldo global a favor aplicado al Pedido #${pedido.codigoSeguimiento}`
                        }, { transaction: t });
                    }
                }
            }
        }

        const montoIngresado = parseFloat(monto) || 0;
        const totalAbonado = montoIngresado + totalSaldosAplicados;

        if (totalAbonado < totalPedido) {
            throw new AppError("El monto total abonado no cubre el total del pedido.", 400);
        }

        const vuelto = totalAbonado - totalPedido;
        let montoAFavorGenerado = 0;
        let saldoAFavorDisponible = 0;
        let montoRealCaja = montoIngresado;

        if (vuelto > 0) {
            if (!esEfectivo) {
                throw new AppError("Solo se permite pagar de más o dar vuelto si el método de pago es Efectivo.", 400);
            }
            if (dejarVueltoAFavor) {
                montoAFavorGenerado = vuelto;
                saldoAFavorDisponible = vuelto;
                // El cajero se queda con toda la plata física ingresada
                montoRealCaja = montoIngresado;
            } else {
                // El cajero devuelve el vuelto físico
                montoRealCaja = montoIngresado - vuelto;
            }
        }

        const nuevoPago = await models.Pago.create({
            pedidoId,
            registradoPorId: usuarioId,
            metodoPagoId,
            cajaId: cajaAbierta.id,
            monto: montoRealCaja,
            montoAFavorGenerado,
            saldoAFavorDisponible,
            estado: "COMPLETADO"
        }, { transaction: t });

        await pedido.update({ cobrado: true }, { transaction: t });

        // Registrar el pago de caja en MovimientoCuentaCorriente
        if (montoRealCaja > 0) {
            await models.MovimientoCuentaCorriente.create({
                clienteId: pedido.clienteId,
                negocioId,
                pedidoId: pedido.id,
                tipoMovimiento: "CREDITO",
                monto: montoRealCaja,
                saldoResultante: 0,
                comentario: `Cobro en caja para Pedido #${pedido.codigoSeguimiento}`
            }, { transaction: t });
        }

        // Recalcular el saldo global real del cliente solo por si acaso lo siguen mirando
        // Aunque la fuente de la verdad ahora son los pedidos impagos
        const cliente = await models.Cliente.findOne({ where: { id: pedido.clienteId, negocioId }, transaction: t });
        if (cliente) {
            // El saldo bajó por el total del pedido pagado,
            // ya que los saldos a favor (vouchers) se manejan en una contabilidad separada (Pago.saldoAFavorDisponible).
            // NOTA: Si se usó el saldo global, esa porción NO debe reducir el saldo (porque consumir saldo global = mover saldo a 0).
            const saldoAnterior = parseFloat(cliente.saldoCuentaCorriente || 0);
            const nuevoSaldo = saldoAnterior - (totalPedido - montoAUsarGlobal);
            await cliente.update({ saldoCuentaCorriente: nuevoSaldo }, { transaction: t });
        }

        try {
            const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
            const config = await ConfiguracionNegocio.findOne({ where: { negocioId }, transaction: t });
            let debeFacturar = false;
            
            if (config && config.afipActivo && config.afipCertificado && config.afipLlavePrivada) {
                if (config.afipModoFacturacion === "AUTOMATICO") {
                    debeFacturar = true;
                } else if (config.afipModoFacturacion === "MANUAL" && data.facturarAfip === true) {
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
            monto: montoRealCaja
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

        const cliente = await models.Cliente.findOne({ where: { id: pago.pedido.clienteId, negocioId }, transaction: t });
        if (cliente) {
            const saldoAnterior = parseFloat(cliente.saldoCuentaCorriente || 0);
            const nuevoSaldo = saldoAnterior + parseFloat(pago.monto);

            await models.MovimientoCuentaCorriente.create({
                clienteId: cliente.id,
                negocioId,
                pedidoId: pago.pedido.id,
                tipoMovimiento: "DEBITO",
                monto: parseFloat(pago.monto),
                saldoResultante: nuevoSaldo,
                comentario: `Anulación del Pago #${pago.id} para Pedido #${pago.pedido.codigoSeguimiento}`
            }, { transaction: t });

            await cliente.update({ saldoCuentaCorriente: nuevoSaldo }, { transaction: t });
        }

        await pago.update({ estado: "ANULADO" }, { transaction: t });

        await t.commit();

        emitToTenant(negocioId, "pago_anulado", {
            pagoId: pago.id,
            pedidoId: pago.pedido.id
        });

        // Intentar cancelar el pedido usando la lógica estándar, pero no fallar si no se puede (ya que el pago ya se anuló)
        try {
            const { cambiarEstadoPedido } = await import("../pedidos/pedido.service.js");
            // Se usa "ADMIN" como rol para forzar la cancelación aunque el pedido ya esté en estados avanzados, 
            // ya que la anulación del pago es una operación de caja fuerte.
            await cambiarEstadoPedido(negocioId, usuarioId, "ADMIN", pago.pedido.id, "CANCELADO", "Anulación del pago asociado", "Anulación de pago", "El pago asociado a este pedido fue anulado desde caja.");
        } catch (pedidoError) {
            console.error("⚠️ El pago se anuló pero falló la cancelación del pedido asociado:", pedidoError.message);
        }

        return true;
    } catch (error) {
        if (!t.finished) await t.rollback();
        throw error;
    }
};

export const obtenerMetodosPago = async (negocioId) => {
    return await models.MetodoPago.findAll({ where: { negocioId } });
};

export const crearMetodoPago = async (negocioId, data) => {
    return await models.MetodoPago.create({
        negocioId,
        nombre: data.nombre,
        icono: data.icono || "Banknote",
        activo: data.activo !== undefined ? data.activo : true,
        esFijo: false
    });
};

export const toggleMetodoPago = async (negocioId, id) => {
    const metodo = await models.MetodoPago.findOne({ where: { id, negocioId } });
    if (!metodo) {
        throw new AppError("Método de pago no encontrado.", 404);
    }
    await metodo.update({ activo: !metodo.activo });
    return metodo;
};

export const eliminarMetodoPago = async (negocioId, id) => {
    const metodo = await models.MetodoPago.findOne({ where: { id, negocioId } });
    if (!metodo) {
        throw new AppError("Método de pago no encontrado.", 404);
    }
    if (metodo.esFijo) {
        throw new AppError("No se puede eliminar un método de pago fijo del sistema.", 400);
    }
    await metodo.destroy();
    return true;
};

export const facturarPagoRetroactivo = async (negocioId, pagoId) => {
    const pago = await models.Pago.findOne({ 
        where: { id: pagoId },
        include: [{ model: models.Pedido, as: "pedido" }]
    });

    if (!pago || pago.pedido.negocioId !== negocioId) {
        throw new AppError("Pago no encontrado.", 404);
    }

    if (pago.cae) {
        throw new AppError("Este pago ya se encuentra facturado en AFIP.", 400);
    }

    if (pago.estado !== "COMPLETADO") {
        throw new AppError("Solo se pueden facturar pagos completados.", 400);
    }

    const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
    const config = await ConfiguracionNegocio.findOne({ where: { negocioId } });

    if (!config || !config.afipActivo || !config.afipCertificado || !config.afipLlavePrivada) {
        throw new AppError("AFIP no está configurado o está inactivo para este negocio.", 400);
    }

    // Generamos factura retroactiva (usando la fecha actual por defecto de la AFIP)
    const afipData = await generarFacturaPedido(negocioId, pago.pedido, null, pago);
    
    await pago.update({
        cae: afipData.cae,
        vencimientoCae: afipData.vencimientoCae,
        nroComprobante: afipData.nroComprobante.toString(),
        tipoComprobante: afipData.tipoComprobante
    });

    return pago;
};

export const obtenerSaldosAFavor = async (negocioId, clienteId) => {
    const pagos = await models.Pago.findAll({
        where: {
            saldoAFavorDisponible: { [sequelize.Op.gt]: 0 },
            estado: 'COMPLETADO'
        },
        include: [{
            model: models.Pedido,
            as: 'pedido',
            where: { clienteId, negocioId },
            attributes: ['id', 'codigoSeguimiento', 'createdAt']
        }],
        order: [['createdAt', 'ASC']]
    });

    return pagos.map(p => ({
        pagoId: p.id,
        pedidoId: p.pedido.id,
        codigoSeguimiento: p.pedido.codigoSeguimiento,
        fechaOriginal: p.createdAt,
        montoDisponible: parseFloat(p.saldoAFavorDisponible)
    }));
};

