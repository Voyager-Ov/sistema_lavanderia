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
            return {
                cae: pedido.factura.cae,
                nroComprobante: parseInt(pedido.factura.numeroFactura) || 1,
                factura: pedido.factura
            };
        }

        let negocio = null;
        try {
            negocio = await Negocio.findByPk(negocioId);
        } catch (e) {}
        const tipoFactura = negocio && negocio.condicionIva === "RESPONSABLE_INSCRIPTO" ? "A" : "B";

        // Calcular importes de la factura
        let subtotal = 0;
        if (pedido.detalles && Array.isArray(pedido.detalles)) {
            subtotal = pedido.detalles.reduce((sum, item) => sum + (parseFloat(item.precioHistorico) * parseInt(item.cantidad)), 0);
        }
        const costoEnvio = parseFloat(pedido.costoEnvio) || 0;
        const total = subtotal + costoEnvio;

        const baseImponible = parseFloat((total / 1.21).toFixed(2));
        const iva = parseFloat((total - baseImponible).toFixed(2));

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
