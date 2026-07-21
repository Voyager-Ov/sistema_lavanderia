import { AppError } from "../../utils/errors.js";
import { models } from "../../models/index.js";
import { generarFacturaPedido } from "../integraciones/afip.service.js";
import { connectionManager } from "../../models/connectionManager.js";

export const facturarPagoRetroactivo = async (negocioId, pagoId) => {
    const pago = await models.Pago.findOne({ 
        where: { id: pagoId },
        include: [{ model: models.Pedido, as: "pedido" }]
    });

    if (!pago || pago.pedido.negocioId !== negocioId) {
        throw new AppError("Pago no encontrado.", 404);
    }

    if (pago.cae) {
        throw new AppError("Este pago ya se encuentra facturado en AFIP.", 400);
    }

    if (pago.estado !== "COMPLETADO") {
        throw new AppError("Solo se pueden facturar pagos completados.", 400);
    }

    const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
    const config = await ConfiguracionNegocio.findOne({ where: { negocioId } });

    if (!config || !config.afipActivo || !config.afipCertificado || !config.afipLlavePrivada) {
        throw new AppError("AFIP no está configurado o está inactivo para este negocio.", 400);
    }

    // Generamos factura retroactiva (usando la fecha actual por defecto de la AFIP)
    const afipData = await generarFacturaPedido(negocioId, pago.pedido, null, pago);
    
    await pago.update({
        cae: afipData.cae,
        vencimientoCae: afipData.vencimientoCae,
        nroComprobante: afipData.nroComprobante.toString(),
        tipoComprobante: afipData.tipoComprobante
    });

    return pago;
};
