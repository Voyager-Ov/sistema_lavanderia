import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class FacturacionService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    async generarFactura(negocioId, numeroPedido) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Pedido, Factura, DetallePedido } = await this._getModels(negocioId);
        const { Negocio } = connectionManager.centralModels;

        const pedido = await Pedido.findOne({
            where: { numeroPedido },
            include: [
                { model: Factura, as: "factura" },
                { model: DetallePedido, as: "detalles" }
            ]
        });

        if (!pedido) {
            throw new AppError("Pedido no encontrado para facturar.", 404, "ORDER_NOT_FOUND");
        }

        if (pedido.factura) {
            const numStr = pedido.factura.numeroFactura.split('-')[1]; // format '0001-00001234'
            const nroComprobante = Number(numStr);
            if (isNaN(nroComprobante)) throw new AppError("Número de factura inválido o corrupto en base de datos.", 500, "INVALID_DATA");

            return {
                cae: pedido.factura.cae,
                nroComprobante,
                factura: pedido.factura
            };
        }

        const negocio = await Negocio.findByPk(negocioId);
        if (!negocio) {
            throw new AppError("Negocio no encontrado en la base central.", 404, "TENANT_NOT_FOUND");
        }
        const tipoFactura = negocio.condicionIva === "RESPONSABLE_INSCRIPTO" ? "A" : "B";

        // Calcular importes de la factura (Regla: Modelo de Mostrador 100% On-Site, costoEnvio = 0, total = subtotal)
        let subtotal = 0;
        if (!pedido.detalles || !Array.isArray(pedido.detalles) || pedido.detalles.length === 0) {
             throw new AppError("El pedido no contiene detalles para facturar.", 400, "EMPTY_ORDER");
        }

        for (const item of pedido.detalles) {
             const precio = Number(item.precioHistorico);
             const cant = Number(item.cantidad);
             if (isNaN(precio) || precio < 0 || isNaN(cant) || cant <= 0) {
                 throw new AppError(`Detalle con ID ${item.id} contiene valores inválidos.`, 400, "INVALID_DATA");
             }
             subtotal += (precio * cant);
        }

        const total = subtotal; // No hay costo de envío

        const baseImponible = Number((total / 1.21).toFixed(2));
        const iva = Number((total - baseImponible).toFixed(2));

        // Generar CAE mock o real
        const cae = Math.floor(10000000000000 + Math.random() * 90000000000000).toString();
        const nroComprobante = Math.floor(1000 + Math.random() * 9000);
        const fechaVencimiento = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // +10 días

        const nuevaFactura = await Factura.create({
            pedidoNumeroPedido: numeroPedido,
            numeroFactura: `0001-${nroComprobante.toString().padStart(8, "0")}`,
            fechaHoraEmision: new Date(),
            tipoFactura,
            cae,
            fechaVencimientoCae: fechaVencimiento,
            baseImponibleTotal: baseImponible,
            ivaDiscriminadoTotal: iva
        });

        return {
            cae: nuevaFactura.cae,
            nroComprobante,
            factura: nuevaFactura
        };
    }
}

export const facturacionService = new FacturacionService();
