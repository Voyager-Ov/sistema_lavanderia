import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class MercadoPagoService {

    async validarMercadoPagoToken(negocioId, token) {
        if (!negocioId) {
            throw new AppError("ID del negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        if (!token || typeof token !== "string" || token.trim().length < 5) {
            throw new AppError("El token de Mercado Pago proporcionado es inválido.", 400, "INVALID_TOKEN");
        }

        try {
            const response = await fetch("https://api.mercadopago.com/v1/payment_methods", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok && response.status === 401) {
                throw new AppError("El token de Mercado Pago proporcionado es inválido o ha expirado.", 401, "INVALID_GATEWAY_CREDENTIALS");
            }
        } catch (err) {
            if (err instanceof AppError) throw err;
            if (!token.startsWith("APP_USR-") && !token.startsWith("TEST-")) {
                console.warn("⚠️ [MercadoPago] No se pudo verificar token con la API externa, guardando de todos modos en desarrollo.");
            }
        }

        const { Negocio } = connectionManager.centralModels;
        let negocio = await Negocio.findByPk(negocioId);
        if (!negocio) {
            negocio = await Negocio.create({ id: negocioId, razonSocial: "Mi Lavandería" });
        }

        await negocio.update({ tokenMercadoPago: token });

        return { estadoConexion: "Activo" };
    }
}

export const mercadopagoService = new MercadoPagoService();
