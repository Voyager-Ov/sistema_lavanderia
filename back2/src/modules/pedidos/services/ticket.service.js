import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class TicketService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    // Renderiza el HTML para impresión térmica de 80mm
    async obtenerTicketHTML(negocioId, numeroPedido) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Pedido, Cliente, DetallePedido, Servicio, Cobro } = await this._getModels(negocioId);
        const { Negocio } = connectionManager.centralModels;

        const negocio = await Negocio.findByPk(negocioId);
        const pedido = await Pedido.findOne({
            where: { numeroPedido },
            include: [
                { model: Cliente, as: "cliente" },
                {
                    model: DetallePedido,
                    as: "detalles",
                    include: [{ model: Servicio, as: "servicio" }]
                },
                { model: Cobro, as: "cobros" }
            ]
        });

        if (!pedido) {
            throw new AppError("Pedido no encontrado para imprimir ticket.", 404, "ORDER_NOT_FOUND");
        }

        const nombreNegocio = negocio?.razonSocial || "LAVANDERÍA EXPRESS";
        const direccionNegocio = negocio?.direccion || "Av. Principal 123";
        const telefonoNegocio = negocio?.telefonoContacto || "(011) 4455-6677";

        const clienteNombre = pedido.cliente ? pedido.cliente.nombre : "Cliente Mostrador";
        const clienteTel = pedido.cliente?.telefono || "N/A";

        let subtotal = 0;
        let itemsHTML = "";

        if (pedido.detalles && Array.isArray(pedido.detalles)) {
            for (const item of pedido.detalles) {
                const srvNombre = item.servicio ? item.servicio.nombre : "Servicio";
                const cant = item.cantidad || 1;
                const precio = parseFloat(item.precioHistorico) || 0;
                const totalItem = cant * precio;
                subtotal += totalItem;

                itemsHTML += `
                <tr>
                    <td style="text-align: left;">${cant}x ${srvNombre}</td>
                    <td style="text-align: right;">$${totalItem.toFixed(2)}</td>
                </tr>`;
            }
        }

        const costoEnvio = parseFloat(pedido.costoEnvio) || 0;
        const total = subtotal + costoEnvio;

        let totalCobrado = 0;
        if (pedido.cobros && Array.isArray(pedido.cobros)) {
            totalCobrado = pedido.cobros.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
        }
        const saldo = Math.max(0, total - totalCobrado);

        const fechaStr = new Date(pedido.fechaHoraCreacion).toLocaleString("es-AR");
        const entregaStr = pedido.fechaHoraEntregaEstimada ? new Date(pedido.fechaHoraEntregaEstimada).toLocaleString("es-AR") : "A confirmar";

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Ticket #${pedido.numeroPedido}</title>
            <style>
                body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .line { border-bottom: 1px dashed #000; margin: 8px 0; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 3px 0; }
            </style>
        </head>
        <body>
            <div class="center bold" style="font-size: 16px;">${nombreNegocio}</div>
            <div class="center">${direccionNegocio}</div>
            <div class="center">Tel: ${telefonoNegocio}</div>
            <div class="line"></div>
            <div><span class="bold">COMPROBANTE DE PEDIDO</span></div>
            <div><span class="bold">Pedido #:</span> LAV-${pedido.numeroPedido}</div>
            <div><span class="bold">Fecha:</span> ${fechaStr}</div>
            <div><span class="bold">Cliente:</span> ${clienteNombre} (${clienteTel})</div>
            <div><span class="bold">Entrega Estimada:</span> ${entregaStr}</div>
            <div class="line"></div>
            <table>
                <thead>
                    <tr style="border-bottom: 1px solid #000;">
                        <th style="text-align: left;">Descripción</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
            <div class="line"></div>
            <div>Subtotal: $${subtotal.toFixed(2)}</div>
            ${costoEnvio > 0 ? `<div>Costo Envío: $${costoEnvio.toFixed(2)}</div>` : ''}
            <div class="bold" style="font-size: 14px;">TOTAL: $${total.toFixed(2)}</div>
            <div>Pagado: $${totalCobrado.toFixed(2)}</div>
            <div class="bold">SALDO PENDIENTE: $${saldo.toFixed(2)}</div>
            <div class="line"></div>
            ${pedido.observaciones ? `<div><span class="bold">Notas:</span> ${pedido.observaciones}</div><div class="line"></div>` : ''}
            <div class="center bold" style="margin-top: 10px;">¡Gracias por su preferencia!</div>
            <div class="center" style="font-size: 10px; margin-top: 5px;">Conserve este ticket para el retiro</div>
        </body>
        </html>`;
    }

    // Generación dinámica al vuelo de etiquetas de prendas (en memoria, sin persistencia en BD)
    async generarTicketsPrenda(negocioId, numeroPedido, cantidad) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Pedido } = await this._getModels(negocioId);

        const pedido = await Pedido.findByPk(numeroPedido);
        if (!pedido) {
            throw new AppError("Pedido no encontrado.", 404, "ORDER_NOT_FOUND");
        }

        const cant = parseInt(cantidad) || 1;
        const result = [];

        for (let i = 1; i <= cant; i++) {
            result.push({
                id: i,
                pedidoId: numeroPedido,
                codigo: `TAG-${numeroPedido}-${i}`,
                createdAt: new Date().toISOString()
            });
        }

        return result;
    }

    // Consulta de etiquetas formateadas al vuelo según la cantidad de ítems del pedido
    async obtenerTicketsPrenda(negocioId, numeroPedido) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Pedido, DetallePedido } = await this._getModels(negocioId);

        const pedido = await Pedido.findOne({
            where: { numeroPedido },
            include: [{ model: DetallePedido, as: "detalles" }]
        });

        if (!pedido) {
            throw new AppError("Pedido no encontrado.", 404, "ORDER_NOT_FOUND");
        }

        let totalPrendas = 0;
        if (pedido.detalles && Array.isArray(pedido.detalles)) {
            totalPrendas = pedido.detalles.reduce((sum, d) => sum + (parseInt(d.cantidad) || 1), 0);
        }
        if (totalPrendas === 0) totalPrendas = 1;

        return this.generarTicketsPrenda(negocioId, numeroPedido, totalPrendas);
    }
}

export const ticketService = new TicketService();
