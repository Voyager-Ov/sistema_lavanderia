import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class CancelacionService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    async cancelarPedido(negocioId, numeroPedido, data) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Pedido, Estado, CambioEstadoPedido, CuentaCorriente, MovimientoCuenta, Cobro } = await this._getModels(negocioId);

        const pedido = await Pedido.findByPk(numeroPedido, {
            include: [{ model: Cobro, as: "cobros" }]
        });

        if (!pedido) {
            throw new AppError("Pedido no encontrado para cancelar.", 404, "ORDER_NOT_FOUND");
        }

        if (pedido.estado === "CANCELADO") {
            throw new AppError("El pedido ya se encuentra cancelado.", 400, "ORDER_ALREADY_CANCELLED");
        }
        if (pedido.estado === "ENTREGADO") {
            throw new AppError("No se puede cancelar un pedido que ya ha sido entregado.", 400, "ORDER_ALREADY_DELIVERED");
        }

        // Registrar motivo y descripción en las observaciones del pedido
        const motivoText = data.motivoCancelacion ? `Motivo: ${data.motivoCancelacion}` : "";
        const descText = data.descripcionCancelacion ? `Detalle: ${data.descripcionCancelacion}` : "";
        const obsFinales = [pedido.observaciones, "[CANCELADO]", motivoText, descText].filter(Boolean).join(" | ");

        await pedido.update({ estado: "CANCELADO", observaciones: obsFinales, cobrado: false });

        // Calcular total cobrado previamente en este pedido usando la propiedad correcta (montoAbonado)
        let totalCobrado = 0;
        if (pedido.cobros && Array.isArray(pedido.cobros)) {
            totalCobrado = pedido.cobros.reduce((sum, c) => sum + (parseFloat(c.montoAbonado) || 0), 0);
        }
        if (totalCobrado <= 0 && pedido.cobrado) {
            totalCobrado = parseFloat(pedido.total) || 0;
        }

        if (totalCobrado > 0) {
            if (data.accionDinero === "SALDO_A_FAVOR" && pedido.clienteId) {
                // Acreditar a la cuenta corriente del cliente
                let cuenta = await CuentaCorriente.findOne({ where: { clienteId: pedido.clienteId } });
                if (!cuenta) {
                    cuenta = await CuentaCorriente.create({ clienteId: pedido.clienteId, saldo: 0 });
                }
                const nuevoSaldo = (parseFloat(cuenta.saldo) || 0) + totalCobrado;
                await cuenta.update({ saldo: nuevoSaldo });

                await MovimientoCuenta.create({
                    cuentaCorrienteId: cuenta.id,
                    tipo: "CREDITO",
                    monto: totalCobrado,
                    concepto: `Devolución por cancelación de pedido #${numeroPedido}`,
                    fechaHora: new Date()
                });
            } else if (data.accionDinero === "DEVOLVER") {
                const { Caja, MovimientoCaja } = await this._getModels(negocioId);
                const empleadoId = data.empleadoId || data.usuarioId;
                
                let cajaAbierta = null;
                if (empleadoId) {
                    cajaAbierta = await Caja.findOne({ where: { estadoCaja: "Abierta", empleadoId } });
                }
                if (!cajaAbierta) {
                    cajaAbierta = await Caja.findOne({ where: { estadoCaja: "Abierta", negocioId } });
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
                    });
                    movimientoCajaId = egresoCaja.id;
                }

                await Cobro.create({
                    pedidoNumeroPedido: numeroPedido,
                    montoAbonado: -Math.abs(totalCobrado),
                    montoRecibidoEfectivo: -Math.abs(totalCobrado),
                    vueltoEntregado: 0,
                    fechaHora: new Date(),
                    movimientoCajaId
                });
            }
        }

        // Transición de estado a CANCELADO
        let estadoCancelado = await Estado.findOne({ where: { nombre: "CANCELADO" } });
        if (!estadoCancelado) {
            estadoCancelado = await Estado.create({ nombre: "CANCELADO", descripcion: "Pedido cancelado", ambito: "Pedido" });
        }

        const ultimoCambio = await CambioEstadoPedido.findOne({
            where: { pedidoNumeroPedido: numeroPedido, fechaHoraFin: null },
            order: [["id", "DESC"]]
        });

        if (ultimoCambio) {
            await ultimoCambio.update({ fechaHoraFin: new Date() });
        }

        await CambioEstadoPedido.create({
            pedidoNumeroPedido: numeroPedido,
            estadoId: estadoCancelado.id,
            fechaHoraInicio: new Date()
        });

        return { message: "Pedido cancelado correctamente.", numeroPedido };
    }
}

export const cancelacionService = new CancelacionService();
