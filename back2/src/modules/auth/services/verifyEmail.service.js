import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import { emailService } from "../../../utils/email.util.js";

class VerifyEmailService {
    /**
     * Confirmar Correo Electrónico con Código de 6 dígitos
     * Exige email obligatorio y código. Valida expiración y actualiza emailConfirmado = true.
     */
    async verifyEmail({ email, code, token, tokenConfirmacion }) {
        const { Usuario } = connectionManager.centralModels;
        const userEmail = email ? String(email).trim().toLowerCase() : null;
        const rawCode = tokenConfirmacion ? tokenConfirmacion : (code ? code : token);
        const codigoIngresado = rawCode ? String(rawCode).trim() : null;

        if (!userEmail) {
            throw new AppError("Debes proporcionar tu correo electrónico.", 400, "MISSING_EMAIL");
        }

        if (!codigoIngresado) {
            throw new AppError("Debes proporcionar un código de verificación.", 400, "MISSING_CODE");
        }

        let usuario = await Usuario.findByPk(userEmail);
        if (!usuario && userEmail.includes(" ")) {
            const emailConPlus = userEmail.replace(/\s+/g, "+");
            usuario = await Usuario.findByPk(emailConPlus);
        }

        if (!usuario) {
            throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
        }

        if (usuario.emailConfirmado) {
            return { message: "El correo electrónico ya fue verificado previamente." };
        }

        const codigoGuardado = String(usuario.tokenConfirmacion).trim();
        if (!codigoGuardado || codigoGuardado !== codigoIngresado) {
            throw new AppError("El código de verificación es incorrecto.", 400, "INVALID_CODE");
        }

        if (usuario.tokenConfirmacionExpires && new Date() > new Date(usuario.tokenConfirmacionExpires)) {
            throw new AppError("El código de verificación ha expirado.", 400, "EXPIRED_CODE");
        }

        usuario.emailConfirmado = true;
        usuario.tokenConfirmacion = null;
        usuario.tokenConfirmacionExpires = null;
        await usuario.save();

        return { message: "Correo electrónico verificado exitosamente." };
    }

    /**
     * Reenviar Código de Verificación
     * Regenera atómicamente el código de 6 dígitos y reenvía el correo electrónico.
     */
    async resendVerification(email) {
        const { Usuario } = connectionManager.centralModels;
        const userEmail = email.trim().toLowerCase();

        if (!userEmail) {
            throw new AppError("Debes proporcionar tu correo electrónico.", 400, "MISSING_EMAIL");
        }

        const usuario = await Usuario.findByPk(userEmail);
        if (!usuario) {
            throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
        }

        if (usuario.emailConfirmado) {
            throw new AppError("El correo electrónico ya está verificado.", 400, "ALREADY_VERIFIED");
        }

        const tokenConfirmacion = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        usuario.tokenConfirmacion = tokenConfirmacion;
        usuario.tokenConfirmacionExpires = tokenExpires;
        await usuario.save();

        const nombre = usuario.email.split("@")[0];
        await emailService.enviarCodigoVerificacion(userEmail, nombre, tokenConfirmacion);

        return { message: "Código de verificación reenviado exitosamente." };
    }
}

export const verifyEmailService = new VerifyEmailService();
