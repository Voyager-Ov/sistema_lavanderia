import { configuracionService } from "../services/configuracion.service.js";
import { afipService } from "../services/afip.service.js";
import { mercadopagoService } from "../services/mercadopago.service.js";
import { successResponse } from "../../../utils/response.util.js";
import { AppError } from "../../../utils/appError.js";

const getTenantId = (req) => {
    const negocioId = req.user?.negocioId;
    if (!negocioId) {
        throw new AppError("No se ha identificado el negocio activo en la sesión.", 401, "TENANT_REQUIRED");
    }
    return negocioId;
};

export const getConfiguracion = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const config = await configuracionService.getConfiguracion(negocioId);
        return successResponse(res, 200, "Configuración recuperada exitosamente", config);
    } catch (error) {
        next(error);
    }
};

export const actualizarConfiguracion = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const config = await configuracionService.actualizarConfiguracion(negocioId, req.body);
        return successResponse(res, 200, "Configuración actualizada exitosamente", config);
    } catch (error) {
        next(error);
    }
};

export const subirCertificadosAfip = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        
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

        await afipService.guardarCertificadosAfip(negocioId, certPath, keyPath);
        const config = await configuracionService.getConfiguracion(negocioId);
        return successResponse(res, 200, "Certificados de AFIP guardados exitosamente", config);
    } catch (error) {
        next(error);
    }
};

export const subirLogo = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const logoPath = req.file ? `/uploads/logos/${req.file.filename}` : null;

        const config = await configuracionService.guardarLogo(negocioId, logoPath);
        return successResponse(res, 200, "Logo actualizado exitosamente", config);
    } catch (error) {
        next(error);
    }
};

export const validarMercadoPagoToken = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const token = req.body.tokenMercadoPago;
        
        if (!token) {
            throw new AppError("El campo 'tokenMercadoPago' es obligatorio.", 400, "MISSING_MERCADOPAGO_TOKEN");
        }

        const result = await mercadopagoService.validarMercadoPagoToken(negocioId, token);
        return successResponse(res, 200, "Credenciales de Mercado Pago validadas exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const listarMotivosCancelacion = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const motivos = await configuracionService.listarMotivosCancelacion(negocioId);
        return successResponse(res, 200, "Motivos de cancelación recuperados exitosamente", motivos);
    } catch (error) {
        next(error);
    }
};

export const crearMotivoCancelacion = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const motivo = await configuracionService.crearMotivoCancelacion(negocioId, req.body);
        return successResponse(res, 201, "Motivo de cancelación creado exitosamente", motivo);
    } catch (error) {
        next(error);
    }
};

export const eliminarMotivoCancelacion = async (req, res, next) => {
    try {
        const negocioId = getTenantId(req);
        const result = await configuracionService.eliminarMotivoCancelacion(negocioId, req.params.id);
        return successResponse(res, 200, "Motivo de cancelación eliminado exitosamente", result);
    } catch (error) {
        next(error);
    }
};
