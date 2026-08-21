import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import { emailService } from "../../../utils/email.util.js";

class PasswordService {
    /**
     * Solicitar Restablecimiento de Contraseña (Olvido de Clave)
     * Genera token seguro y reenvía enlace por correo electrónico.
     */
    async forgotPassword(email) {
        const { Usuario } = connectionManager.centralModels;
        const userEmail = (email || "").trim().toLowerCase();

        const usuario = await Usuario.findByPk(userEmail);
        if (usuario && usuario.activo) {
            const resetToken = crypto.randomBytes(32).toString("hex");
            usuario.tokenConfirmacion = resetToken;
            usuario.tokenConfirmacionExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
            await usuario.save();

            await emailService.enviarRestablecimientoPassword(userEmail, resetToken);
        }

        // Respuesta genérica siempre para prevenir enumeración de cuentas
        return { message: "Si el correo ingresado coincide con una cuenta activa, recibirás las instrucciones para restablecer tu contraseña." };
    }

    /**
     * Restablecer Contraseña mediante Token de Enlace y Email
     */
    async resetPassword({ token, email, newPassword, password }) {
        const { Usuario } = connectionManager.centralModels;
        const resetToken = (token || "").trim();
        const userEmail = email ? String(email).trim().toLowerCase() : null;
        const nuevaClave = newPassword || password;

        if (!resetToken) {
            throw new AppError("El token de restablecimiento es requerido.", 400, "MISSING_TOKEN");
        }

        if (!nuevaClave || nuevaClave.length < 6) {
            throw new AppError("La nueva contraseña debe tener al menos 6 caracteres.", 400, "INVALID_PASSWORD_LENGTH");
        }

        let usuario = null;
        if (userEmail) {
            usuario = await Usuario.findByPk(userEmail);
            if (!usuario || usuario.tokenConfirmacion !== resetToken) {
                throw new AppError("El enlace de restablecimiento es inválido o no coincide con este usuario.", 400, "INVALID_TOKEN");
            }
        } else {
            usuario = await Usuario.findOne({ where: { tokenConfirmacion: resetToken } });
            if (!usuario) {
                throw new AppError("El enlace de restablecimiento es inválido o ha expirado.", 400, "INVALID_TOKEN");
            }
        }

        if (usuario.tokenConfirmacionExpires && new Date() > new Date(usuario.tokenConfirmacionExpires)) {
            throw new AppError("El enlace de restablecimiento ha expirado.", 400, "EXPIRED_TOKEN");
        }

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(nuevaClave, salt);
        usuario.emailConfirmado = true;
        usuario.tokenConfirmacion = null;
        usuario.tokenConfirmacionExpires = null;
        await usuario.save();

        return { message: "Contraseña actualizada exitosamente." };
    }

    /**
     * Cambiar Contraseña desde Sesión Activa
     */
    async changePassword(email, oldPassword, newPassword) {
        const { Usuario } = connectionManager.centralModels;
        const userEmail = (email || "").trim().toLowerCase();

        const usuario = await Usuario.findByPk(userEmail);
        if (!usuario) {
            throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
        }

        const userPassword = usuario.password || usuario.passwordHash;
        if (!userPassword) {
            throw new AppError("Tu cuenta está vinculada únicamente con Google OAuth y no posee contraseña asignada.", 400, "GOOGLE_ONLY_ACCOUNT");
        }

        const isMatch = await bcrypt.compare(oldPassword, userPassword);
        if (!isMatch) {
            throw new AppError("La contraseña actual es incorrecta.", 400, "INVALID_OLD_PASSWORD");
        }

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(newPassword, salt);
        await usuario.save();

        return { message: "Contraseña cambiada exitosamente." };
    }
}

export const passwordService = new PasswordService();
