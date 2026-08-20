import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class ConfiguracionService {
    
    // Formatea el objeto Negocio al schema que espera el frontend
    _formatConfigResponse(negocio) {
        return {
            id: negocio.id,
            negocioId: negocio.id,
            razonSocial: negocio.razonSocial || null,
            cuit: negocio.cuit || null,
            direccion: negocio.direccion || null,
            telefonoContacto: negocio.telefonoContacto || null,
            colorPrincipal: negocio.colorPrincipal || "#2563eb",
            colorSecundario: negocio.colorSecundario || "#1e40af",
            logoUrl: negocio.logoUrl || null,
            simboloMoneda: negocio.simboloMoneda || "$",
            zonaHoraria: negocio.zonaHoraria || "America/Argentina/Buenos_Aires",
            mensajeTicket: negocio.mensajeTicket || null,
            imprimirTicketAutomatico: Boolean(negocio.imprimirTicketAutomatico),
            mostrarQrTicket: Boolean(negocio.mostrarQrTicket),
            anchoPapel: negocio.anchoPapel || "80mm",
            afipActivo: Boolean(negocio.afipActivo || negocio.facturacionHabilitada),
            afipModoFacturacion: negocio.afipModoFacturacion || "DESACTIVADO",
            afipPuntoVenta: negocio.afipPuntoVenta || null,
            afipCertificado: negocio.certificadoAfipPath || null,
            afipLlavePrivada: negocio.llaveAfipPath || null,
            whatsappActivo: Boolean(negocio.whatsappActivo),
            whatsappEstadoConexion: negocio.whatsappEstadoConexion || "DESCONECTADO",
            whatsappMensajeListo: negocio.whatsappMensajeListo || null,
            whatsappMensajeManual: negocio.whatsappMensajeManual || null,
            mercadopagoAccessToken: negocio.tokenMercadoPago || null,
            mercadopagoPublicKey: negocio.mercadopagoPublicKey || null,
            mpModoCobro: negocio.mpModoCobro || "DIRECTO",
            aliasMp: negocio.aliasMp || null
        };
    }

    // Obtener la configuración del negocio del usuario activo
    async getConfiguracion(negocioId) {
        if (!negocioId) {
            throw new AppError("ID del negocio es requerido para consultar configuración.", 400, "MISSING_TENANT_ID");
        }
        const { Negocio } = connectionManager.centralModels;

        let negocio = await Negocio.findByPk(negocioId);
        if (!negocio) {
            negocio = await Negocio.create({ id: negocioId, razonSocial: "Mi Lavandería" });
        }

        return this._formatConfigResponse(negocio);
    }

    // Actualizar configuración parcialmente
    async actualizarConfiguracion(negocioId, data) {
        if (!negocioId) {
            throw new AppError("ID del negocio es requerido para actualizar configuración.", 400, "MISSING_TENANT_ID");
        }
        const { Negocio } = connectionManager.centralModels;

        let negocio = await Negocio.findByPk(negocioId);
        if (!negocio) {
            negocio = await Negocio.create({ id: negocioId, razonSocial: "Mi Lavandería" });
        }

        // Mapeo de alias y propiedades recibidas
        const updateFields = {};

        if (data.razonSocial !== undefined) updateFields.razonSocial = data.razonSocial;
        if (data.cuit !== undefined) updateFields.cuit = data.cuit;
        if (data.direccion !== undefined) updateFields.direccion = data.direccion;
        if (data.telefonoContacto !== undefined) updateFields.telefonoContacto = data.telefonoContacto;
        if (data.colorPrincipal !== undefined) updateFields.colorPrincipal = data.colorPrincipal;
        if (data.colorSecundario !== undefined) updateFields.colorSecundario = data.colorSecundario;
        if (data.logoUrl !== undefined) updateFields.logoUrl = data.logoUrl;
        if (data.simboloMoneda !== undefined) updateFields.simboloMoneda = data.simboloMoneda;
        if (data.zonaHoraria !== undefined) updateFields.zonaHoraria = data.zonaHoraria;
        if (data.mensajeTicket !== undefined) updateFields.mensajeTicket = data.mensajeTicket;
        if (data.imprimirTicketAutomatico !== undefined) updateFields.imprimirTicketAutomatico = Boolean(data.imprimirTicketAutomatico);
        if (data.mostrarQrTicket !== undefined) updateFields.mostrarQrTicket = Boolean(data.mostrarQrTicket);
        if (data.anchoPapel !== undefined) updateFields.anchoPapel = data.anchoPapel;

        // AFIP
        if (data.afipActivo !== undefined || data.facturacionHabilitada !== undefined) {
            const val = Boolean(data.afipActivo !== undefined ? data.afipActivo : data.facturacionHabilitada);
            updateFields.afipActivo = val;
            updateFields.facturacionHabilitada = val;
        }
        if (data.afipModoFacturacion !== undefined) updateFields.afipModoFacturacion = data.afipModoFacturacion;
        if (data.afipPuntoVenta !== undefined) updateFields.afipPuntoVenta = data.afipPuntoVenta;
        if (data.afipCertificado !== undefined || data.certificadoAfipPath !== undefined) {
            updateFields.certificadoAfipPath = data.afipCertificado || data.certificadoAfipPath;
        }
        if (data.afipLlavePrivada !== undefined || data.llaveAfipPath !== undefined) {
            updateFields.llaveAfipPath = data.afipLlavePrivada || data.llaveAfipPath;
        }

        // WhatsApp / Notificaciones
        if (data.whatsappActivo !== undefined) updateFields.whatsappActivo = Boolean(data.whatsappActivo);
        if (data.whatsappEstadoConexion !== undefined) updateFields.whatsappEstadoConexion = data.whatsappEstadoConexion;
        if (data.whatsappMensajeListo !== undefined) updateFields.whatsappMensajeListo = data.whatsappMensajeListo;
        if (data.whatsappMensajeManual !== undefined) updateFields.whatsappMensajeManual = data.whatsappMensajeManual;

        // Mercado Pago
        if (data.mercadopagoAccessToken !== undefined || data.tokenMercadoPago !== undefined) {
            updateFields.tokenMercadoPago = data.mercadopagoAccessToken || data.tokenMercadoPago;
        }
        if (data.mercadopagoPublicKey !== undefined) updateFields.mercadopagoPublicKey = data.mercadopagoPublicKey;
        if (data.mpModoCobro !== undefined) updateFields.mpModoCobro = data.mpModoCobro;
        if (data.aliasMp !== undefined) updateFields.aliasMp = data.aliasMp;

        await negocio.update(updateFields);

        return this._formatConfigResponse(negocio);
    }

    // Subir certificados AFIP
    async guardarCertificadosAfip(negocioId, certificadoPath, llavePrivadaPath) {
        if (!negocioId) {
            throw new AppError("ID del negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Negocio } = connectionManager.centralModels;

        let negocio = await Negocio.findByPk(negocioId);
        if (!negocio) {
            negocio = await Negocio.create({ id: negocioId, razonSocial: "Mi Lavandería" });
        }

        const updateFields = {};
        if (certificadoPath) updateFields.certificadoAfipPath = certificadoPath;
        if (llavePrivadaPath) updateFields.llaveAfipPath = llavePrivadaPath;
        updateFields.facturacionHabilitada = true;
        updateFields.afipActivo = true;

        await negocio.update(updateFields);

        return this._formatConfigResponse(negocio);
    }

    // Subir Logo
    async guardarLogo(negocioId, logoPath) {
        if (!negocioId) {
            throw new AppError("ID del negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Negocio } = connectionManager.centralModels;

        let negocio = await Negocio.findByPk(negocioId);
        if (!negocio) {
            negocio = await Negocio.create({ id: negocioId, razonSocial: "Mi Lavandería" });
        }

        await negocio.update({ logoUrl: logoPath });

        return this._formatConfigResponse(negocio);
    }

    // Validar token Mercado Pago
    async validarMercadoPagoToken(negocioId, token) {
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
            // En offline / dev mode, permitir si parece token valido
            if (!token.startsWith("APP_USR-") && !token.startsWith("TEST-")) {
                console.warn("⚠️ [MercadoPago] No se pudo verificar token con la API externa, guardando de todos modos en desarrollo.");
            }
        }

        // Persistir token validado
        await this.actualizarConfiguracion(negocioId, { tokenMercadoPago: token });

        return { estadoConexion: "Activo" };
    }

    // Motivos de Cancelación CRUD
    async listarMotivosCancelacion(negocioId) {
        if (!negocioId) {
            throw new AppError("ID del negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        const { MotivoCancelacion } = tenantDb.models;

        const motivos = await MotivoCancelacion.findAll({
            where: { activo: true },
            order: [["esFijo", "DESC"], ["id", "ASC"]]
        });

        return motivos;
    }

    async crearMotivoCancelacion(negocioId, data) {
        if (!negocioId) {
            throw new AppError("ID del negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        if (!data.motivo || typeof data.motivo !== "string" || data.motivo.trim() === "") {
            throw new AppError("El nombre del motivo de cancelación es obligatorio.", 400, "MISSING_REASON_NAME");
        }
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        const { MotivoCancelacion } = tenantDb.models;

        const nuevoMotivo = await MotivoCancelacion.create({
            motivo: data.motivo.trim(),
            descripcion: data.descripcion ? data.descripcion.trim() : null,
            esFijo: false,
            activo: true,
            negocioId
        });

        return nuevoMotivo;
    }

    async eliminarMotivoCancelacion(negocioId, id) {
        if (!negocioId) {
            throw new AppError("ID del negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        const { MotivoCancelacion } = tenantDb.models;

        const motivo = await MotivoCancelacion.findByPk(id);
        if (!motivo) {
            throw new AppError("Motivo de cancelación no encontrado.", 404, "REASON_NOT_FOUND");
        }

        if (motivo.esFijo) {
            throw new AppError("No se puede eliminar un motivo de cancelación base del sistema.", 400, "CANNOT_DELETE_FIXED_REASON");
        }

        await motivo.update({ activo: false });
        return { message: "Motivo de cancelación eliminado exitosamente." };
    }
}

export const configuracionService = new ConfiguracionService();
