import { AppError } from "../utils/errors.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { models, sequelize } from "../models/index.js";
import { connectionManager } from "../models/connectionManager.js";
import * as emailService from "./email.service.js";
import { generarCodigoVerificacionEmail } from "../utils/codeGenerator.util.js";
import crypto from "crypto";

export const registerAdmin = async (data) => {
    const { negocioNombre, usuarioNombre, email, password } = data;

    let negocio, admin;
    const transaction = await sequelize.transaction();
    try {
        const existeEmail = await models.Usuario.findOne({ where: { email } });
        if (existeEmail) throw new AppError("EMAIL_IN_USE", 400);

        negocio = await models.Negocio.create({
            nombre: negocioNombre,
            estadoSuscripcion: "PRUEBA"
        }, { transaction });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        admin = await models.Usuario.create({
            negocioId: negocio.id,
            nombre: usuarioNombre,
            email,
            passwordHash,
            rol: "ADMIN",
            activo: true,
            emailVerificado: false,
            verificationCode: generarCodigoVerificacionEmail(),
            verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
        }, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

    // FUERA DE LA TRANSACCIÓN: Sincronizar el Tenant DB y enviar el correo.
    // Esto evita un DEADLOCK en Postgres, ya que getTenantDb abre una nueva conexión
    // y si la tabla Negocio está bloqueada por la transacción actual, se queda colgado infinitamente.
    try {
        const tenantContext = await connectionManager.getTenantDb(negocio.id, true);
        
        await tenantContext.models.MetodoPago.create({
            negocioId: negocio.id,
            nombre: "Efectivo",
            esFijo: true,
            activo: true
        });

        // Enviar correo de verificación de forma asíncrona (no bloqueante)
        emailService.enviarCodigoVerificacion(admin.email, admin.nombre, admin.verificationCode).catch(console.error);

        return { 
            mensaje: "Registro exitoso. Revisa tu correo para verificar tu cuenta.",
            usuario: { id: admin.id, nombre: admin.nombre, email: admin.email, rol: admin.rol } 
        };
    } catch (error) {
        console.error("Error al inicializar tenant db o correo:", error);
        // Retornamos éxito de todos modos porque el admin sí se creó.
        return { 
            mensaje: "Registro completado, pero ocurrió un problema interno al inicializar el local.",
            usuario: { id: admin.id, nombre: admin.nombre, email: admin.email, rol: admin.rol } 
        };
    }
};

export const login = async (email, password) => {
    const usuario = await models.Usuario.findOne({ where: { email } });
    if (!usuario) throw new AppError("INVALID_CREDENTIALS", 403);
    if (!usuario.activo) throw new AppError("USER_DISABLED", 401);

    if (!usuario.emailVerificado) {
        throw new AppError("Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.", 403);
    }

    if (!usuario.passwordHash) {
        throw new AppError("Esta cuenta usa inicio de sesión con Google. No tiene contraseña configurada.", 403);
    }

    const validPassword = await bcrypt.compare(password, usuario.passwordHash);
    if (!validPassword) throw new AppError("INVALID_CREDENTIALS", 403);

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError("Missing JWT_SECRET in environment", 401);
    const token = jwt.sign(
        { id: usuario.id, negocioId: usuario.negocioId, rol: usuario.rol },
        secret,
        { expiresIn: "8h" }
    );

    return { token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } };
};

export const verificarEmail = async (email, code) => {
    const usuario = await models.Usuario.findOne({ where: { email } });
    if (!usuario) throw new AppError("Usuario no encontrado.", 404);
    if (usuario.emailVerificado) throw new AppError("El email ya está verificado.", 400);

    if (usuario.verificationCode !== code) {
        throw new AppError("Código de verificación incorrecto.", 400);
    }

    if (new Date() > usuario.verificationExpires) {
        throw new AppError("El código de verificación ha expirado. Solicita uno nuevo.", 400);
    }

    usuario.emailVerificado = true;
    usuario.verificationCode = null;
    usuario.verificationExpires = null;
    await usuario.save();

    return { mensaje: "Email verificado correctamente. Ya puedes iniciar sesión." };
};

export const reenviarCodigoVerificacion = async (email) => {
    const usuario = await models.Usuario.findOne({ where: { email } });
    if (!usuario) throw new AppError("Usuario no encontrado.", 404);
    if (usuario.emailVerificado) throw new AppError("El email ya está verificado.", 400);

    const nuevoCodigo = generarCodigoVerificacionEmail();
    usuario.verificationCode = nuevoCodigo;
    usuario.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    await usuario.save();

    // Enviar correo de forma asíncrona
    emailService.enviarCodigoVerificacion(usuario.email, usuario.nombre, nuevoCodigo).catch(err => {
        console.error("❌ Error al reenviar correo de verificación (segundo plano):", err);
    });

    return { mensaje: "Código reenviado exitosamente. Revisa tu bandeja de entrada." };
};

export const solicitarRecuperacionPassword = async (email) => {
    const usuario = await models.Usuario.findOne({ where: { email } });
    if (!usuario) {
        // Por seguridad, no decimos que el email no existe, solo damos un mensaje genérico
        return { mensaje: "Si el correo está registrado, recibirás un enlace de recuperación." };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    usuario.resetPasswordToken = resetToken;
    usuario.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await usuario.save();

    // Enviamos el correo de forma asíncrona para no bloquear la respuesta
    emailService.enviarEnlaceRecuperacion(usuario.email, usuario.nombre, resetToken).catch(err => {
        console.error("❌ Error al enviar correo de recuperación (segundo plano):", err);
    });

    return { mensaje: "Si el correo está registrado, recibirás un enlace de recuperación." };
};

export const resetPassword = async (token, newPassword) => {
    const usuario = await models.Usuario.findOne({ where: { resetPasswordToken: token } });
    if (!usuario) {
        throw new AppError("Token inválido o incorrecto.", 400);
    }

    if (new Date() > usuario.resetPasswordExpires) {
        throw new AppError("El token ha expirado. Solicita uno nuevo.", 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    usuario.passwordHash = passwordHash;
    usuario.resetPasswordToken = null;
    usuario.resetPasswordExpires = null;
    // Si no estaba verificado, lo verificamos porque el reseteo por mail prueba propiedad del mail
    if (!usuario.emailVerificado) {
        usuario.emailVerificado = true;
        usuario.verificationCode = null;
        usuario.verificationExpires = null;
    }
    
    await usuario.save();

    return { mensaje: "Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña." };
};

export const changePassword = async (usuarioId, oldPassword, newPassword) => {
    const usuario = await models.Usuario.findByPk(usuarioId);
    if (!usuario) throw new AppError("Usuario no encontrado.", 404);

    if (!usuario.passwordHash) {
        throw new AppError("Esta cuenta usa inicio de sesión con Google. No tiene una contraseña configurada.", 400);
    }

    const validPassword = await bcrypt.compare(oldPassword, usuario.passwordHash);
    if (!validPassword) throw new AppError("La contraseña actual es incorrecta.", 403);

    const salt = await bcrypt.genSalt(10);
    usuario.passwordHash = await bcrypt.hash(newPassword, salt);
    await usuario.save();

    return { mensaje: "Contraseña actualizada exitosamente." };
};
