import crypto from "crypto";
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

        let negocio = null;
        try {
            negocio = await Negocio.findByPk(negocioId);
        } catch (e) {
            console.warn("⚠️ [TicketService] No se pudo cargar Negocio:", e.message);
        }
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

        const nombreNegocio = negocio?.razonSocial || "LAVANDERÍA";
        const direccionNegocio = negocio?.direccion || "";
        const telefonoNegocio = negocio?.telefonoContacto || "";
        const mensajeTicket = negocio?.mensajeTicket || "¡Gracias por su preferencia!";
        const simboloMoneda = negocio?.simboloMoneda || "$";
        const mostrarQr = Boolean(negocio?.mostrarQrTicket);

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
                    <td style="text-align: left; padding: 2px 0;">${cant}x ${srvNombre}</td>
                    <td style="text-align: right; padding: 2px 0;">${simboloMoneda}${totalItem.toFixed(2)}</td>
                </tr>`;
            }
        }

        const costoEnvio = parseFloat(pedido.costoEnvio) || 0;
        const total = subtotal + costoEnvio;

        let totalCobrado = 0;
        if (pedido.cobros && Array.isArray(pedido.cobros)) {
            totalCobrado = pedido.cobros.reduce((sum, c) => sum + (parseFloat(c.montoAbonado || c.monto) || 0), 0);
        }
        if (pedido.cobrado && totalCobrado === 0) {
            totalCobrado = total;
        }
        const saldo = Math.max(0, total - totalCobrado);

        const fechaStr = new Date(pedido.fechaHoraCreacion).toLocaleString("es-AR");
        const entregaStr = pedido.fechaHoraEntregaEstimada ? new Date(pedido.fechaHoraEntregaEstimada).toLocaleString("es-AR") : "A confirmar";
        const estadoCobroText = pedido.cobrado || totalCobrado >= total ? "PAGADO" : "PENDIENTE DE PAGO";

        const anchoPapel = negocio?.anchoPapel === "58mm" ? "58mm" : "80mm";
        const widthPx = anchoPapel === "58mm" ? "220px" : "280px";

        const token = crypto
            .createHmac("sha256", "SECRET_TRACKING_KEY")
            .update(`${negocioId}:${pedido.numeroPedido}:${pedido.fechaHoraCreacion || pedido.createdAt}`)
            .digest("hex")
            .substring(0, 16);

        const baseUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : "http://localhost:3000";
        const trackingUrl = `${baseUrl}/tracking/${negocioId}/LAV-${pedido.numeroPedido}?token=${token}`;

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Ticket #LAV-${pedido.numeroPedido}</title>
            <style>
                @page { size: ${anchoPapel} auto; margin: 0; }
                body { box-sizing: border-box; font-family: 'Courier New', Courier, monospace; font-size: ${anchoPapel === "58mm" ? "11px" : "12px"}; width: ${widthPx}; margin: 0 auto; padding: 10px 14px; color: #000; background: #fff; text-align: left; word-break: break-word; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .line { border-bottom: 1px dashed #000; margin: 6px 0; }
                table { width: 100%; border-collapse: collapse; }
                td, th { padding: 2px 0; font-size: ${anchoPapel === "58mm" ? "10px" : "11px"}; }
                .qr-container { text-align: center; margin-top: 10px; padding-top: 6px; border-top: 1px dashed #000; }
                .qr-img { width: ${anchoPapel === "58mm" ? "90px" : "110px"}; height: ${anchoPapel === "58mm" ? "90px" : "110px"}; margin: 4px auto; display: block; }
                @media print {
                    body { margin: 0 auto; padding: 10px 14px; width: 100%; box-sizing: border-box; }
                }
            </style>
        </head>
        <body onload="window.print()">
            <div class="center bold" style="font-size: 16px; text-transform: uppercase;">${nombreNegocio}</div>
            ${direccionNegocio ? `<div class="center">${direccionNegocio}</div>` : ''}
            ${telefonoNegocio ? `<div class="center">Tel: ${telefonoNegocio}</div>` : ''}
            <div class="line"></div>
            <div class="center bold" style="font-size: 13px;">COMPROBANTE DE PEDIDO</div>
            <div><span class="bold">Pedido #:</span> LAV-${pedido.numeroPedido}</div>
            <div><span class="bold">Fecha:</span> ${fechaStr}</div>
            <div><span class="bold">Cliente:</span> ${clienteNombre}</div>
            ${clienteTel !== "N/A" ? `<div><span class="bold">Teléfono:</span> ${clienteTel}</div>` : ''}
            <div><span class="bold">Entrega Est.:</span> ${entregaStr}</div>
            <div><span class="bold">Estado Pago:</span> ${estadoCobroText}</div>
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
            <div>Subtotal: ${simboloMoneda}${subtotal.toFixed(2)}</div>
            ${costoEnvio > 0 ? `<div>Costo Envío: ${simboloMoneda}${costoEnvio.toFixed(2)}</div>` : ''}
            <div class="bold" style="font-size: 14px; margin-top: 4px;">TOTAL: ${simboloMoneda}${total.toFixed(2)}</div>
            <div>Abonado: ${simboloMoneda}${totalCobrado.toFixed(2)}</div>
            <div class="bold" style="font-size: 13px;">SALDO PENDIENTE: ${simboloMoneda}${saldo.toFixed(2)}</div>
            <div class="line"></div>
            ${pedido.observaciones ? `<div><span class="bold">Notas:</span> ${pedido.observaciones}</div><div class="line"></div>` : ''}
            <div class="center bold" style="margin-top: 10px;">${mensajeTicket}</div>
            
            <!-- SEGUIMIENTO QR OBLIGATORIO -->
            <div class="qr-container">
                <div class="bold" style="font-size: 10px; text-transform: uppercase;">Escanee para seguimiento de su pedido</div>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(trackingUrl)}" alt="QR Seguimiento" class="qr-img" />
                <div class="bold" style="font-size: 11px; letter-spacing: 1px;">LAV-${pedido.numeroPedido}</div>
            </div>
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
