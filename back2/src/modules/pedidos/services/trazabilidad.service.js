import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class TrazabilidadService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    // Cambiar estado de un pedido y registrar auditoría de tiempo
    async cambiarEstado(negocioId, numeroPedido, nuevoEstadoNombre) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Pedido, Estado, CambioEstadoPedido } = await this._getModels(negocioId);

        const pedido = await Pedido.findByPk(numeroPedido);
        if (!pedido) {
            throw new AppError("Pedido no encontrado para cambiar estado.", 404, "ORDER_NOT_FOUND");
        }

        let estado = await Estado.findOne({ where: { nombre: nuevoEstadoNombre } });
        if (!estado) {
            estado = await Estado.create({ nombre: nuevoEstadoNombre, descripcion: `Estado ${nuevoEstadoNombre}`, ambito: "Pedido" });
        }

        // Cerrar el cambio de estado previo asignando fechaHoraFin
        const ultimoCambio = await CambioEstadoPedido.findOne({
            where: { pedidoNumeroPedido: numeroPedido, fechaHoraFin: null },
            order: [["id", "DESC"]]
        });

        if (ultimoCambio) {
            await ultimoCambio.update({ fechaHoraFin: new Date() });
        }

        // Registrar nuevo estado
        await CambioEstadoPedido.create({
            pedidoNumeroPedido: numeroPedido,
            estadoId: estado.id,
            fechaHoraInicio: new Date()
        });

        return { numeroPedido, nuevoEstado: nuevoEstadoNombre };
    }

    // Marcar ticket como impreso
    async marcarTicketImpreso(negocioId, numeroPedido) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Pedido } = await this._getModels(negocioId);

        const pedido = await Pedido.findByPk(numeroPedido);
        if (!pedido) {
            throw new AppError("Pedido no encontrado.", 404, "ORDER_NOT_FOUND");
        }

        await pedido.update({ ticketImpreso: true });
        return { message: "Ticket marcado como impreso correctamente." };
    }
}

export const trazabilidadService = new TrazabilidadService();
