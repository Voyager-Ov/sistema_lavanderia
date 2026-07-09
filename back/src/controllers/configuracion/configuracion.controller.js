import * as configuracionService from "../../services/configuracion/configuracion.service.js";
import { successResponse } from "../../utils/response.util.js";

export const getConfiguracion = async (req, res, next) => {
    try {
        const config = await configuracionService.obtenerConfiguracion(req.user.negocioId);
        return successResponse(res, 200, null, config);
    } catch (error) {
        next(error);
    }
};

export const updateConfiguracion = async (req, res, next) => {
    try {
        // req.body contiene los campos a actualizar (logoUrl, colorPrincipal, etc)
        const configActualizada = await configuracionService.actualizarConfiguracion(req.user.negocioId, req.body);
        return successResponse(res, 200, "Configuración actualizada correctamente", configActualizada);
    } catch (error) {
        next(error);
    }
};

export const uploadCertificadosAfip = async (req, res, next) => {
    try {
        if (!req.files) {
            return res.status(400).json({ error: "No se proporcionaron archivos." });
        }

        const certificadoFile = req.files["certificado"] ? req.files["certificado"][0] : null;
        const llavePrivadaFile = req.files["llavePrivada"] ? req.files["llavePrivada"][0] : null;

        const certificadoString = certificadoFile ? certificadoFile.buffer.toString('utf-8') : null;
        const llavePrivadaString = llavePrivadaFile ? llavePrivadaFile.buffer.toString('utf-8') : null;

        if (!certificadoString && !llavePrivadaString) {
            return res.status(400).json({ error: "Los archivos subidos están vacíos o son inválidos." });
        }

        const configActualizada = await configuracionService.guardarCertificadosAfip(
            req.user.negocioId,
            certificadoString,
            llavePrivadaString
        );

        return successResponse(res, 200, "Certificados de AFIP guardados exitosamente", configActualizada);
    } catch (error) {
        next(error);
    }
};
