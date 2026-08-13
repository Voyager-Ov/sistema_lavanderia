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

        // Registrar motivo y descripción en las observaciones o campos del pedido
        const motivoText = data.motivoCancelacion ? `Motivo: ${data.motivoCancelacion}` : "";
        const descText = data.descripcionCancelacion ? `Detalle: ${data.descripcionCancelacion}` : "";
        const obsFinales = [pedido.observaciones, "[CANCELADO]", motivoText, descText].filter(Boolean).join(" | ");

        await pedido.update({ observaciones: obsFinales });

        // Procesar acción de dinero cobrado
        let totalCobrado = 0;
        if (pedido.cobros && Array.isArray(pedido.cobros)) {
            totalCobrado = pedido.cobros.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
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
                // Registrar cobro negativo por devolución en efectivo
                await Cobro.create({
                    pedidoNumeroPedido: numeroPedido,
                    monto: -totalCobrado,
                    fechaHora: new Date(),
                    observacion: `Devolución en efectivo por cancelación del pedido #${numeroPedido}`
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
