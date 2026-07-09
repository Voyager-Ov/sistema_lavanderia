import { AppError } from "../../utils/errors.js";
import { models } from "../../models/index.js";
import { emitToTenant } from "../../socket/socket.js";
import { generarFacturaPedido } from "../integraciones/afip.service.js";
import { connectionManager } from "../../models/connectionManager.js";

export const registrarPago = async (negocioId, usuarioId, data) => {
    const { pedidoId, metodoPagoId, monto } = data;

    const cajaAbierta = await models.Caja.findOne({ where: { negocioId, usuarioId, estado: "ABIERTA" } });
    if (!cajaAbierta) {
        throw new AppError("No se puede cobrar pedidos sin abrir una caja.", 400);
    }

    // Validar Pedido existe y pertenece al negocio
    const pedido = await models.Pedido.findOne({ where: { id: pedidoId, negocioId } });
    if (!pedido) {
        throw new AppError("Pedido no encontrado.", 404);
    }

    const pagoExistente = await models.Pago.findOne({ where: { pedidoId, estado: "COMPLETADO" } });
    if (pagoExistente) {
        throw new AppError("Este pedido ya está registrado como pagado.", 400);
    }

    const nuevoPago = await models.Pago.create({
        pedidoId,
        registradoPorId: usuarioId,
        metodoPagoId,
        cajaId: cajaAbierta.id,
        monto,
        estado: "COMPLETADO"
    });

    // Intentar generar factura en AFIP si el negocio lo tiene activo
    try {
        const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
        const config = await ConfiguracionNegocio.findOne({ where: { negocioId } });
        // 1. Evaluar si debe facturar en este momento
        let debeFacturar = false;
        
        if (config && config.afipActivo && config.afipCertificado && config.afipLlavePrivada) {
            if (config.afipModoFacturacion === "AUTOMATICO") {
                debeFacturar = true;
            } else if (config.afipModoFacturacion === "MANUAL" && data.facturarAfip === true) {
                debeFacturar = true;
            }
        }
        
        // 2. Ejecutar facturación si corresponde
        if (debeFacturar) {
            const afipData = await generarFacturaPedido(negocioId, pedido, null, nuevoPago);
            
            await nuevoPago.update({
                cae: afipData.cae,
                vencimientoCae: afipData.vencimientoCae,
                nroComprobante: afipData.nroComprobante.toString(),
                tipoComprobante: afipData.tipoComprobante
            });
        }
    } catch (afipError) {
        console.error("⚠️ El pago se registró pero falló la facturación de AFIP:", afipError.message);
        // Podríamos guardar este error en una tabla de notificaciones para el cajero
    }

    // Actualizar el estado del pedido a cobrado = true
    await pedido.update({ cobrado: true });

    // Emitir evento al Socket para actualizar dashboard y tablas de pedidos
    emitToTenant(negocioId, "pago_registrado", {
        pagoId: nuevoPago.id,
        pedidoId: pedido.id,
        monto
    });
    
    // También notificamos que el pedido fue cobrado
    emitToTenant(negocioId, "pedido_actualizado", {
        action: "UPDATE_STATUS",
        pedidoId: pedido.id,
        cobrado: true
    });

    return nuevoPago;
};

export const anularPago = async (negocioId, usuarioId, pagoId) => {
    const cajaAbierta = await models.Caja.findOne({ where: { negocioId, usuarioId, estado: "ABIERTA" } });
    if (!cajaAbierta) {
        throw new AppError("No se puede anular pagos. Debe abrir una caja.", 400);
    }

    const pago = await models.Pago.findOne({ where: { id: pagoId }, include: [{ model: models.Pedido, as: "pedido" }] });
    if (!pago || pago.pedido.negocioId !== negocioId) {
        throw new AppError("Pago no encontrado.", 404);
    }

    // Si la caja del pago original ya fue cerrada, teóricamente no se puede anular tan simple (descuadra históricos), 
    // pero por simplicidad inicial, si el pago se anula, le descontamos a la caja actual o simplemente lo marcamos ANULADO.
    // Lo correcto según el usuario: "aparecer en el recuento que se cancelo". 
    // Si anulamos el pago, pasa a ANULADO y ya no sumará en los ingresos de SU caja abierta actual.
    
    await pago.update({ estado: "ANULADO" });
    // Revertermos el pedido
    await pago.pedido.update({ estado: "CANCELADO" });

    emitToTenant(negocioId, "pago_anulado", {
        pagoId: pago.id,
        pedidoId: pago.pedido.id
    });
    
    emitToTenant(negocioId, "pedido_actualizado", {
        action: "UPDATE_STATUS",
        pedidoId: pago.pedido.id,
        estado: "CANCELADO"
    });

    return true;
};

export const obtenerMetodosPago = async (negocioId) => {
    return await models.MetodoPago.findAll({ where: { negocioId, esHabilitado: true } });
};

export const crearMetodoPago = async (negocioId, data) => {
    return await models.MetodoPago.create({
        negocioId,
        nombre: data.nombre,
        tipo: data.tipo,
        esHabilitado: data.esHabilitado !== undefined ? data.esHabilitado : true
    });
};

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
