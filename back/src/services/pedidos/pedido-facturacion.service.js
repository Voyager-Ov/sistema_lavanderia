import { AppError } from "../../utils/errors.js";
import { generarFacturaPedido } from "../integraciones/afip.service.js";
import { obtenerPedidoPorId } from "./pedido-core.service.js";

export const generarFacturaElectronica = async (negocioId, pedidoId) => {
    const pedido = await obtenerPedidoPorId(negocioId, pedidoId);
    
    // Validaciones Estrictas
    if (pedido.estado === "CANCELADO") {
        throw new AppError("No se puede facturar un pedido cancelado.", 400);
    }

    if (pedido.facturado) {
        throw new AppError("Este pedido ya posee una factura emitida.", 400);
    }
    
    if (!pedido.cobrado) {
        throw new AppError("No se puede facturar un pedido que aún no ha sido cobrado.", 400);
    }
    
    // Aquí llamamos a la integración AFIP
    // El servicio AFIP ya tira errores (e.g., 400 "Configuración de AFIP está incompleta", 400 "No está activo")
    // por lo que este controlador es robusto frente a la falta de certificados
    
    const factura = await generarFacturaPedido(negocioId, pedido, pedido.cliente, null);
    
    // Guardamos el CAE y el Nro de comprobante en la tabla Pedido
    await pedido.update({ 
        facturado: true, 
        facturaCae: factura.cae, 
        facturaVtoCae: factura.vencimientoCae,
        facturaNro: factura.nroComprobante 
    });

    return factura;
};
