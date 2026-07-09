import { connectionManager } from "../../models/connectionManager.js";
import { AppError } from "../../utils/errors.js";

/**
 * Obtiene la configuración del negocio. Si no existe, la crea con valores por defecto.
 */
export const obtenerConfiguracion = async (negocioId) => {
    const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
    
    let config = await ConfiguracionNegocio.findOne({ where: { negocioId } });
    
    if (!config) {
        config = await ConfiguracionNegocio.create({ negocioId });
    }
    
    return config;
};

/**
 * Actualiza la configuración del negocio.
 */
export const actualizarConfiguracion = async (negocioId, datosActualizacion) => {
    const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
    
    let config = await ConfiguracionNegocio.findOne({ where: { negocioId } });
    
    if (!config) {
        config = await ConfiguracionNegocio.create({ negocioId, ...datosActualizacion });
    } else {
        await config.update(datosActualizacion);
    }
    
    return config;
};

/**
 * Guarda los certificados AFIP, encriptando la llave privada por seguridad.
 */
export const guardarCertificadosAfip = async (negocioId, certificadoString, llavePrivadaString) => {
    const { encrypt } = await import("../../utils/crypto.util.js");
    const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
    
    let config = await ConfiguracionNegocio.findOne({ where: { negocioId } });
    
    const llaveEncriptada = llavePrivadaString ? encrypt(llavePrivadaString) : null;
    
    if (!config) {
        config = await ConfiguracionNegocio.create({ 
            negocioId, 
            afipCertificado: certificadoString, 
            afipLlavePrivada: llaveEncriptada 
        });
    } else {
        await config.update({ 
            afipCertificado: certificadoString || config.afipCertificado, 
            afipLlavePrivada: llaveEncriptada || config.afipLlavePrivada 
        });
    }
    
    // Retornamos la config SIN la llave privada por seguridad
    const response = config.toJSON();
    delete response.afipLlavePrivada;
    return response;
};
