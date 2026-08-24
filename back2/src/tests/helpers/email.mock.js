import { jest } from "@jest/globals";
import { emailService } from "../../utils/email.util.js";

/**
 * In-Memory Email Store para interceptar y validar despachos de emails en tests.
 */
class EmailMockStore {
    constructor() {
        this.emails = [];
    }

    clear() {
        this.emails = [];
    }

    push(emailData) {
        this.emails.push({
            ...emailData,
            timestamp: new Date()
        });
    }

    getAll() {
        return this.emails;
    }

    getByRecipient(email) {
        const lower = (email || "").toLowerCase().trim();
        return this.emails.filter(e => (e.to || "").toLowerCase().trim() === lower);
    }

    getLastByRecipient(email) {
        const matches = this.getByRecipient(email);
        return matches.length > 0 ? matches[matches.length - 1] : null;
    }

    getLast() {
        return this.emails.length > 0 ? this.emails[this.emails.length - 1] : null;
    }

    hasEmailFor(email) {
        return this.getByRecipient(email).length > 0;
    }
}

export const emailStore = new EmailMockStore();

/**
 * Inicializa los espías sobre emailService para interceptar todos los envíos.
 */
export const setupEmailMock = () => {
    emailStore.clear();

    jest.spyOn(emailService, "enviarCodigoVerificacion").mockImplementation(async (to, nombre, codigo) => {
        emailStore.push({
            type: "VERIFY_CODE",
            to,
            nombre,
            codigo
        });
        return { success: true };
    });

    jest.spyOn(emailService, "enviarNotificacionNuevaSolicitudSuperAdmin").mockImplementation(async (solicitud) => {
        emailStore.push({
            type: "SUPERADMIN_NEW_REQUEST",
            to: "superadmin@sistema.com",
            solicitud
        });
        return { success: true };
    });

    jest.spyOn(emailService, "enviarResultadoSolicitudNegocio").mockImplementation(async ({ email, nombre, negocioNombre, estado, motivoRechazo }) => {
        emailStore.push({
            type: "REQUEST_RESULT",
            to: email,
            nombre,
            negocioNombre,
            estado,
            motivoRechazo
        });
        return { success: true };
    });

    jest.spyOn(emailService, "enviarRestablecimientoPassword").mockImplementation(async (to, token) => {
        emailStore.push({
            type: "RESET_PASSWORD",
            to,
            token
        });
        return { success: true };
    });

    return emailStore;
};
