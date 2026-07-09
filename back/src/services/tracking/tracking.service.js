import { AppError } from "../../utils/errors.js";
import { models } from "../../models/index.js";

export const obtenerTrackingPedido = async (codigoSeguimiento) => {
    const pedido = await models.Pedido.findOne({
        where: { codigoSeguimiento },
        include: [
            {
                model: models.Negocio,
                as: "negocio",
                attributes: ["nombre"] // Solo el nombre, nada de CUIT o datos sensibles
            },
            {
                model: models.PedidoItem,
                as: "items",
                attributes: ["cantidad", "precioUnitario", "subtotal", "estado"],
                include: [
                    {
                        model: models.Producto,
                        as: "producto",
                        attributes: ["nombre"] // Solo el nombre del producto
                    }
                ]
            }
        ]
    });

    if (!pedido) {
        throw new AppError("Pedido no encontrado.", 404);
    }

    // Filtramos datos internos y mandamos lo justo y necesario al cliente
    return {
        codigoSeguimiento: pedido.codigoSeguimiento,
        estadoActual: pedido.estado,
        fechaCreacion: pedido.createdAt,
        totalCobrado: pedido.cobrado,
        totalMonto: pedido.total,
        negocio: pedido.negocio.nombre,
        items: pedido.items.map(item => ({
            producto: item.producto.nombre,
            cantidad: item.cantidad,
            subtotal: item.subtotal,
            estado: item.estado
        }))
    };
};
