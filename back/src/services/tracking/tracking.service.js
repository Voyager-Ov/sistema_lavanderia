import { AppError } from "../../utils/errors.js";
import { connectionManager, models } from "../../models/index.js";

export const obtenerTrackingInfo = async (negocioId, codigo) => {
    // Need to initialize the tenant context if not already done, 
    // but the router might not have the tenant middleware since it's a public route.
    // We should manually get the tenant DB and models.
    const tenantContext = await connectionManager.getTenantDb(negocioId);
    const tenantModels = tenantContext.models;

    const ticket = await tenantModels.Ticket.findOne({
        where: { codigo },
        include: [
            {
                model: tenantModels.Pedido,
                as: "pedido",
                include: [
                    { model: tenantModels.Cliente, as: "cliente", attributes: ["nombre"] },
                    { 
                        model: tenantModels.PedidoItem, 
                        as: "items",
                        include: [{ model: tenantModels.Producto, as: "producto", attributes: ["nombre"] }]
                    }
                ]
            }
        ]
    });

    if (!ticket) {
        throw new AppError("Ticket no encontrado o código inválido.", 404);
    }

    // Retornamos un objeto seguro, sin datos sensibles.
    return {
        ticketCodigo: ticket.codigo,
        pedidoId: ticket.pedido.id,
        estado: ticket.pedido.estado,
        cobrado: ticket.pedido.cobrado,
        clienteNombre: ticket.pedido.cliente?.nombre || 'Consumidor Final',
        total: ticket.pedido.total,
        fechaRecepcion: ticket.pedido.fechaRecepcion,
        fechaEntregaEstimada: ticket.pedido.fechaEntregaEstimada,
        items: ticket.pedido.items.map(item => ({
            nombre: item.producto?.nombre || 'Item',
            cantidad: item.cantidad
        }))
    };
};
