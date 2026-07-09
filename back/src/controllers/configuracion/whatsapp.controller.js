import * as whatsappService from "../../services/integraciones/whatsapp.service.js";
import { connectionManager } from "../../models/connectionManager.js";
import { successResponse } from "../../utils/response.util.js";

export const getEstadoWhatsApp = async (req, res, next) => {
    try {
        const { negocioId } = req.user;
        const info = await whatsappService.obtenerEstadoWhatsApp(negocioId);
        
        return successResponse(res, 200, "Estado de WhatsApp obtenido exitosamente", info);
    } catch (error) {
        next(error);
    }
};

export const conectarWhatsApp = async (req, res, next) => {
    try {
        const { negocioId } = req.user;
        
        // Marcar como activo en la BD
        const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
        await ConfiguracionNegocio.update(
            { whatsappActivo: true }, 
            { where: { negocioId } }
        );

        const result = await whatsappService.conectarWhatsApp(negocioId);
        return successResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
};

export const desconectarWhatsApp = async (req, res, next) => {
    try {
        const { negocioId } = req.user;
        
        // Marcar como inactivo en BD
        const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
        await ConfiguracionNegocio.update(
            { whatsappActivo: false }, 
            { where: { negocioId } }
        );

        const result = await whatsappService.desconectarWhatsApp(negocioId);
        return successResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
};

export const actualizarMensajeWhatsApp = async (req, res, next) => {
    try {
        const { negocioId } = req.user;
        const { mensaje } = req.body;

        if (!mensaje || !mensaje.includes("{{nombre}}")) {
            return res.status(400).json({ error: "El mensaje debe contener al menos la variable {{nombre}}" });
        }

        const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
        await ConfiguracionNegocio.update(
            { whatsappMensajeListo: mensaje }, 
            { where: { negocioId } }
        );

        return successResponse(res, 200, "Plantilla de mensaje actualizada exitosamente");
    } catch (error) {
        next(error);
    }
};
