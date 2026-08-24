import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class ConfiguracionService {
    
    // Formatea el objeto Negocio al schema que espera el frontend
    _formatConfigResponse(negocio) {
        return {
            id: negocio.id,
            razonSocial: negocio.razonSocial,
            cuit: negocio.cuit,
            direccion: negocio.direccion,
            telefonoContacto: negocio.telefonoContacto,
            colorPrincipal: negocio.colorPrincipal,
            colorSecundario: negocio.colorSecundario,
            logoUrl: negocio.logoUrl,
            simboloMoneda: negocio.simboloMoneda,
            zonaHoraria: negocio.zonaHoraria,
            mensajeTicket: negocio.mensajeTicket,
            imprimirTicketAutomatico: negocio.imprimirTicketAutomatico,
            mostrarQrTicket: negocio.mostrarQrTicket,
            anchoPapel: negocio.anchoPapel,
            facturacionHabilitada: negocio.facturacionHabilitada,
            afipActivo: negocio.afipActivo,
            afipModoFacturacion: negocio.afipModoFacturacion,
            afipPuntoVenta: negocio.afipPuntoVenta,
            certificadoAfipPath: negocio.certificadoAfipPath,
            llaveAfipPath: negocio.llaveAfipPath,
            whatsappActivo: negocio.whatsappActivo,
            whatsappEstadoConexion: negocio.whatsappEstadoConexion,
            whatsappMensajeListo: negocio.whatsappMensajeListo,
            whatsappMensajeManual: negocio.whatsappMensajeManual,
            tokenMercadoPago: negocio.tokenMercadoPago,
            mercadopagoPublicKey: negocio.mercadopagoPublicKey,
            mpModoCobro: negocio.mpModoCobro,
            aliasMp: negocio.aliasMp
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
        if (data.afipActivo !== undefined) updateFields.afipActivo = Boolean(data.afipActivo);
        if (data.facturacionHabilitada !== undefined) updateFields.facturacionHabilitada = Boolean(data.facturacionHabilitada);
        if (data.afipModoFacturacion !== undefined) updateFields.afipModoFacturacion = data.afipModoFacturacion;
        if (data.afipPuntoVenta !== undefined) updateFields.afipPuntoVenta = data.afipPuntoVenta;
        if (data.certificadoAfipPath !== undefined) updateFields.certificadoAfipPath = data.certificadoAfipPath;
        if (data.llaveAfipPath !== undefined) updateFields.llaveAfipPath = data.llaveAfipPath;

        // WhatsApp / Notificaciones
        if (data.whatsappActivo !== undefined) updateFields.whatsappActivo = Boolean(data.whatsappActivo);
        if (data.whatsappEstadoConexion !== undefined) updateFields.whatsappEstadoConexion = data.whatsappEstadoConexion;
        if (data.whatsappMensajeListo !== undefined) updateFields.whatsappMensajeListo = data.whatsappMensajeListo;
        if (data.whatsappMensajeManual !== undefined) updateFields.whatsappMensajeManual = data.whatsappMensajeManual;

        // Mercado Pago
        if (data.tokenMercadoPago !== undefined) updateFields.tokenMercadoPago = data.tokenMercadoPago;
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
