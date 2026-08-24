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
        const { Pedido, Cliente, DetallePedido, Servicio, CambioEstadoPedido, Estado, Cobro } = await this._getModels(negocioId);

        // Extraer número de pedido del código (ej: LAV-123 o 123)
        let numeroPedido = parseInt(codigo);
        if (isNaN(numeroPedido) && codigo.includes("-")) {
            const parts = codigo.split("-");
            numeroPedido = parseInt(parts[1]);
        }

        if (isNaN(numeroPedido)) {
            throw new AppError("Código de seguimiento inválido.", 400, "INVALID_TRACKING_CODE");
        }

        const pedido = await Pedido.findOne({
            where: { numeroPedido },
            include: [
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
            ]
        });

        if (!pedido) {
            throw new AppError(`Pedido no encontrado en la lavandería especificada.`, 404, "ORDER_NOT_FOUND");
        }

        // Validación de Token Criptográfico por pedido (si se provee)
        if (token) {
            const expectedToken = crypto
                .createHmac("sha256", "SECRET_TRACKING_KEY")
                .update(`${negocioId}:${pedido.numeroPedido}:${pedido.fechaHoraCreacion}`)
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
        const detalles = [];
        if (!pedido.detalles || !Array.isArray(pedido.detalles) || pedido.detalles.length === 0) {
            throw new AppError("El pedido no contiene detalles registrados.", 400, "EMPTY_ORDER");
        }

        for (const d of pedido.detalles) {
            const srv = d.servicio ? d.servicio.nombre : "Servicio";
            const cant = Number(d.cantidad);
            const p = Number(d.precioHistorico);
            if (isNaN(cant) || cant <= 0 || isNaN(p) || p < 0) {
                throw new AppError(`Detalle corrupto (ID: ${d.id}).`, 500, "INVALID_DATA");
            }
            subtotal += p * cant;
            detalles.push({ nombre: srv, cantidad: cant });
        }
        
        const total = subtotal; // Sin costo de envío

        let cobradoTotal = 0;
        if (pedido.cobros && Array.isArray(pedido.cobros)) {
            for (const c of pedido.cobros) {
                const monto = Number(c.montoAbonado !== null ? c.montoAbonado : c.monto);
                if (isNaN(monto) || monto < 0) {
                     throw new AppError(`Cobro corrupto (ID: ${c.id}).`, 500, "INVALID_DATA");
                }
                cobradoTotal += monto;
            }
        }

        if (!pedido.fechaHoraPedido) {
            throw new AppError("Falta fechaHoraPedido (fecha de recepción) en registro del pedido.", 500, "INVALID_DATA");
        }

        return {
            ticketCodigo: `LAV-${pedido.numeroPedido}`,
            pedidoId: pedido.numeroPedido,
            estado: estadoActual,
            cobrado: cobradoTotal >= total && total > 0,
            clienteNombre: pedido.cliente ? pedido.cliente.nombre : null,
            total,
            fechaHoraPedido: pedido.fechaHoraPedido,
            fechaHoraEntregaEstimada: pedido.fechaHoraEntregaEstimada,
            detalles
        };
    }
}

export const trackingService = new TrackingService();
