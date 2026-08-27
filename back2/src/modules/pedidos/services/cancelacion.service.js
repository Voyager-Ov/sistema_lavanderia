import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class CancelacionService {

    async _getModels(negocioId) {
        const tenantContext = await connectionManager.getTenantDb(negocioId);
        return { sequelize: tenantContext.sequelize, models: tenantContext.models };
    }

    async cancelarPedido(negocioId, numeroPedido, data) {
        if (!negocioId) {
            throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        }
        const { sequelize, models } = await this._getModels(negocioId);
        const { Pedido, Estado, CambioEstadoPedido, CuentaCorriente, MovimientoCuenta, Cobro, Caja, MovimientoCaja } = models;

        const pedido = await Pedido.findOne({
            where: { numeroPedido, negocioId },
            include: [{ model: Cobro, as: "cobros" }]
        });

        if (!pedido) {
            throw new AppError("Pedido no encontrado para cancelar.", 404, "ORDER_NOT_FOUND");
        }

        if (pedido.estado === "CANCELADO") {
            throw new AppError("El pedido ya se encuentra anulado.", 400, "ORDER_ALREADY_CANCELLED");
        }
        if (pedido.estado === "ENTREGADO") {
            throw new AppError("No se puede cancelar un pedido que ya ha sido entregado.", 400, "ORDER_ALREADY_DELIVERED");
        }

        const transaction = await sequelize.transaction();
        try {
            const motivoText = data.motivoCancelacion ? `Motivo: ${data.motivoCancelacion}` : "";
            const descText = data.descripcionCancelacion ? `Detalle: ${data.descripcionCancelacion}` : "";
            const obsFinales = [pedido.observaciones, "[CANCELADO]", motivoText, descText].filter(Boolean).join(" | ");

            await pedido.update({ estado: "CANCELADO", observaciones: obsFinales, cobrado: false }, { transaction });

            let totalCobrado = 0;
            if (pedido.cobros && Array.isArray(pedido.cobros)) {
                for (const c of pedido.cobros) {
                    const monto = Number(c.montoAbonado);
                    if (isNaN(monto) || monto < 0) throw new AppError("Registro de cobro corrupto.", 500, "INVALID_DATA");
                    totalCobrado += monto;
                }
            }

            if (totalCobrado > 0) {
                if (data.accionDinero === "SALDO_A_FAVOR" && pedido.clienteId) {
                    let cuenta = await CuentaCorriente.findOne({ where: { clienteId: pedido.clienteId }, transaction });
                    if (!cuenta) {
                        cuenta = await CuentaCorriente.create({ clienteId: pedido.clienteId, saldo: 0 }, { transaction });
                    }
                    const currentSaldo = Number(cuenta.saldo);
                    if (isNaN(currentSaldo)) throw new AppError("Saldo de cuenta corriente corrupto.", 500, "INVALID_DATA");
                    const nuevoSaldo = currentSaldo + totalCobrado;
                    await cuenta.update({ saldo: nuevoSaldo }, { transaction });

                    await MovimientoCuenta.create({
                        cuentaCorrienteId: cuenta.id,
                        tipo: "CREDITO",
                        monto: totalCobrado,
                        concepto: `Devolución por cancelación de pedido #${numeroPedido}`,
                        fechaHora: new Date()
                    }, { transaction });
                } else if (data.accionDinero === "DEVOLVER") {
                    const empleadoId = data.empleadoId ?? data.usuarioId;
                    if (!empleadoId) throw new AppError("ID de empleado es requerido para la devolución de dinero.", 400, "MISSING_USER_ID");
                    
                    let cajaAbierta = null;
                    if (empleadoId) {
                        cajaAbierta = await Caja.findOne({ where: { estadoCaja: "Abierta", empleadoId }, transaction });
                    }
                    if (!cajaAbierta) {
                        cajaAbierta = await Caja.findOne({ where: { estadoCaja: "Abierta" }, transaction });
                    }
                    if (!cajaAbierta) {
                        throw new AppError("No posees una caja abierta actualmente. Debes abrir tu turno de caja antes de realizar una devolución.", 400, "NO_OPEN_CASH_REGISTER");
                    }

                    let movimientoCajaId = null;
                    if (cajaAbierta) {
                        const egresoCaja = await MovimientoCaja.create({
                            monto: -Math.abs(totalCobrado),
                            tipoMovimiento: "Egreso por Devolución",
                            observacion: `Devolución en efectivo por cancelación del pedido #${numeroPedido}`,
                            cajaIdCaja: cajaAbierta.idCaja
                        }, { transaction });
                        movimientoCajaId = egresoCaja.id;
                    }

                    await Cobro.create({
                        pedidoNumeroPedido: numeroPedido,
                        montoAbonado: -Math.abs(totalCobrado),
                        montoRecibidoEfectivo: -Math.abs(totalCobrado),
                        vueltoEntregado: 0,
                        fechaHora: new Date(),
                        movimientoCajaId
                    }, { transaction });
                }
            }

            let estadoCancelado = await Estado.findOne({ where: { nombre: "CANCELADO" }, transaction });
            if (!estadoCancelado) {
                estadoCancelado = await Estado.create({ nombre: "CANCELADO", descripcion: "Pedido cancelado", ambito: "Pedido" }, { transaction });
            }

            const ultimoCambio = await CambioEstadoPedido.findOne({
                where: { pedidoNumeroPedido: numeroPedido, fechaHoraFin: null },
                order: [["id", "DESC"]],
                transaction
            });

            if (ultimoCambio) {
                await ultimoCambio.update({ fechaHoraFin: new Date() }, { transaction });
            }

            await CambioEstadoPedido.create({
                pedidoNumeroPedido: numeroPedido,
                estadoId: estadoCancelado.id,
                fechaHoraInicio: new Date()
            }, { transaction });

            await transaction.commit();

            return { message: "Pedido cancelado correctamente.", numeroPedido };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

export const cancelacionService = new CancelacionService();
