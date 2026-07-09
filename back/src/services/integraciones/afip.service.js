import Afip from "@afipsdk/afip.js";
import { connectionManager } from "../../models/connectionManager.js";
import { decrypt } from "../../utils/crypto.util.js";
import { AppError } from "../../utils/errors.js";

/**
 * Inicializa y retorna una instancia de AFIP configurada para un negocio específico.
 */
const getAfipInstance = async (negocioId) => {
    const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
    const config = await ConfiguracionNegocio.findOne({ where: { negocioId } });

    if (!config || !config.afipActivo) {
        throw new AppError("El Facturador de AFIP no está activo para este negocio.", 400);
    }
    if (!config.afipCuit || !config.afipCertificado || !config.afipLlavePrivada || !config.afipPuntoVenta) {
        throw new AppError("La configuración de AFIP está incompleta. Verifique su CUIT, Certificados y Punto de Venta.", 400);
    }

    const llavePrivadaDesencriptada = decrypt(config.afipLlavePrivada);
    if (!llavePrivadaDesencriptada) {
        throw new AppError("Error interno al desencriptar la llave privada de AFIP.", 500);
    }

    // Inicializar SDK de AFIP
    const isProduction = process.env.NODE_ENV === "production";
    
    return new Afip({
        CUIT: parseInt(config.afipCuit, 10),
        cert: config.afipCertificado,
        key: llavePrivadaDesencriptada,
        production: isProduction,
    });
};

/**
 * Crea una Factura Electrónica (Comprobante B o C) en AFIP a partir de un Pedido cobrado.
 */
export const generarFacturaPedido = async (negocioId, pedido, cliente, pago) => {
    const afip = await getAfipInstance(negocioId);
    
    // Obtener la configuración nuevamente para el Punto de Venta
    const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
    const config = await ConfiguracionNegocio.findOne({ where: { negocioId } });
    
    const puntoDeVenta = config.afipPuntoVenta;
    
    // Determinar el tipo de comprobante (11 = Factura C, 6 = Factura B)
    // Para simplificar, asumiremos Monotributo (Factura C = 11) o Responsable Inscripto a Consumidor Final (Factura B = 6).
    // Dejaremos Factura C como default para este ejemplo.
    const tipoComprobante = 11; 
    
    const date = new Date(Date.now() - ((new Date()).getTimezoneOffset() * 60000)).toISOString().split('T')[0].replace(/-/g, '');

    // Obtener el número del último comprobante emitido
    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(puntoDeVenta, tipoComprobante);
    const nroComprobante = lastVoucher + 1;

    // Calcular montos (AFIP espera flotantes, así que casteamos a float si está en string)
    const totalFloat = parseFloat(pedido.total);

    const data = {
        'CantReg': 1,
        'PtoVta': puntoDeVenta,
        'CbteTipo': tipoComprobante, 
        'Concepto': 2, // 2 = Servicios
        'DocTipo': 99, // 99 = Consumidor Final
        'DocNro': 0,
        'CbteDesde': nroComprobante,
        'CbteHasta': nroComprobante,
        'CbteFch': parseInt(date),
        'ImpTotal': totalFloat,
        'ImpTotConc': 0, // No gravado
        'ImpNeto': totalFloat,
        'ImpOpEx': 0, // Exento
        'ImpIVA': 0, // Factura C no discrimina IVA
        'ImpTrib': 0,
        'FchServDesde': parseInt(date),
        'FchServHasta': parseInt(date),
        'FchVtoPago': parseInt(date),
        'MonId': 'PES', // Pesos Argentinos
        'MonCotiz': 1
    };

    try {
        const result = await afip.ElectronicBilling.createVoucher(data);
        return {
            cae: result.CAE,
            vencimientoCae: result.CAEFchVto,
            nroComprobante,
            puntoDeVenta,
            tipoComprobante
        };
    } catch (error) {
        console.error("Error al generar factura AFIP:", error);
        throw new AppError(`Error en AFIP: ${error.message || 'No se pudo generar la factura.'}`, 500);
    }
};
