import crypto from "crypto";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class TrackingService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    async obtenerTrackingPublico(negocioId, codigo, token) {
        if (!negocioId) {
            throw new AppError("Negocio no especificado para tracking.", 400, "MISSING_TENANT_ID");
        }
        let models;
        try {
            models = await this._getModels(negocioId);
        } catch (e) {
            models = await this._getModels(13);
        }
        const { Pedido, Cliente, DetallePedido, Servicio, CambioEstadoPedido, Estado, Cobro } = models;

        // Extraer número de pedido del código (ej: LAV-123 o 123)
        let numeroPedido = parseInt(codigo);
        if (isNaN(numeroPedido) && codigo.includes("-")) {
            const parts = codigo.split("-");
            numeroPedido = parseInt(parts[1]);
        }

        if (isNaN(numeroPedido)) {
            throw new AppError("Código de seguimiento inválido.", 400, "INVALID_TRACKING_CODE");
        }

        const includeClause = [
            { model: Cliente, as: "cliente", attributes: ["nombre"] },
            {
                model: DetallePedido,
                as: "detalles",
                include: [{ model: Servicio, as: "servicio", attributes: ["nombre"] }]
            },
            {
                model: CambioEstadoPedido,
                as: "cambiosEstado",
                include: [{ model: Estado, as: "estado", attributes: ["nombre"] }]
            },
            { model: Cobro, as: "cobros" }
        ];

        let pedido = await Pedido.findOne({
            where: { numeroPedido },
            include: includeClause
        });

        // Smart fallback si el ticket fue impreso con un negocioId previo
        if (!pedido && Number(negocioId) !== 13) {
            try {
                const fallbackModels = await this._getModels(13);
                pedido = await fallbackModels.Pedido.findOne({
                    where: { numeroPedido },
                    include: includeClause
                });
            } catch (e) {}
        }

        if (!pedido) {
            throw new AppError("Pedido no encontrado.", 404, "ORDER_NOT_FOUND");
        }

        // Validación de Token Criptográfico por pedido (si se provee)
        if (token) {
            const expectedToken = crypto
                .createHmac("sha256", "SECRET_TRACKING_KEY")
                .update(`${negocioId}:${pedido.numeroPedido}:${pedido.fechaHoraCreacion || pedido.createdAt}`)
                .digest("hex")
                .substring(0, 16);

            if (token.trim().toLowerCase() !== expectedToken.toLowerCase()) {
                throw new AppError("Token de seguimiento inválido. Escanee el código QR del ticket físico.", 403, "INVALID_TRACKING_TOKEN");
            }
        }

        let estadoActual = "PENDIENTE";
        if (pedido.cambiosEstado && pedido.cambiosEstado.length > 0) {
            const u = pedido.cambiosEstado[pedido.cambiosEstado.length - 1];
            if (u.estado) estadoActual = u.estado.nombre;
        }

        let subtotal = 0;
        const items = [];
        if (pedido.detalles && Array.isArray(pedido.detalles)) {
            for (const d of pedido.detalles) {
                const srv = d.servicio ? d.servicio.nombre : "Servicio";
                const cant = d.cantidad || 1;
                const p = parseFloat(d.precioHistorico) || 0;
                subtotal += p * cant;
                items.push({ nombre: srv, cantidad: cant });
            }
        }
        const total = subtotal + (parseFloat(pedido.costoEnvio) || 0);

        let cobradoTotal = 0;
        if (pedido.cobros) {
            cobradoTotal = pedido.cobros.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
        }

        return {
            ticketCodigo: `LAV-${pedido.numeroPedido}`,
            pedidoId: pedido.numeroPedido,
            estado: estadoActual,
            cobrado: cobradoTotal >= total && total > 0,
            clienteNombre: pedido.cliente ? pedido.cliente.nombre : "Cliente",
            total,
            fechaRecepcion: pedido.fechaHoraCreacion,
            fechaEntregaEstimada: pedido.fechaHoraEntregaEstimada,
            items
        };
    }
}

export const trackingService = new TrackingService();
