import { configuracionService } from "../services/configuracion.service.js";
import { successResponse } from "../../../utils/response.util.js";

export const getConfiguracion = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const config = await configuracionService.getConfiguracion(negocioId);
        return successResponse(res, 200, "Configuración recuperada exitosamente", config);
    } catch (error) {
        next(error);
    }
};

export const actualizarConfiguracion = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const config = await configuracionService.actualizarConfiguracion(negocioId, req.body);
        return successResponse(res, 200, "Configuración actualizada exitosamente", config);
    } catch (error) {
        next(error);
    }
};

export const subirCertificadosAfip = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        
        let certPath = null;
        let keyPath = null;

        if (req.files) {
            if (req.files.certificado && req.files.certificado[0]) {
                certPath = `/uploads/certs/${req.files.certificado[0].filename}`;
            }
            if (req.files.llavePrivada && req.files.llavePrivada[0]) {
                keyPath = `/uploads/certs/${req.files.llavePrivada[0].filename}`;
            }
        }

        const config = await configuracionService.guardarCertificadosAfip(negocioId, certPath, keyPath);
        return successResponse(res, 200, "Certificados de AFIP guardados exitosamente", config);
    } catch (error) {
        next(error);
    }
};

export const subirLogo = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const logoPath = req.file ? `/uploads/logos/${req.file.filename}` : null;

        const config = await configuracionService.guardarLogo(negocioId, logoPath);
        return successResponse(res, 200, "Logo actualizado exitosamente", config);
    } catch (error) {
        next(error);
    }
};

export const validarMercadoPagoToken = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId || 1;
        const token = req.body.tokenMercadoPago || req.body.token;

        const result = await configuracionService.validarMercadoPagoToken(negocioId, token);
        return successResponse(res, 200, "Credenciales de Mercado Pago validadas exitosamente", result);
    } catch (error) {
        next(error);
    }
};
