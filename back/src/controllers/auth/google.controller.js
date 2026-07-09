import { OAuth2Client } from 'google-auth-library';
import { models } from '../../models/index.js';
import { connectionManager } from '../../models/connectionManager.js';
import { AppError } from '../../utils/errors.js';
import jwt from 'jsonwebtoken';
import { normalizeEmail } from '../../utils/email.util.js';
import { successResponse } from '../../utils/response.util.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) throw new AppError("Token de Google no proporcionado.", 400);

        let payload;
        // Si el token tiene 3 partes (separadas por punto), asumimos que es un JWT (id_token)
        if (token.split('.').length === 3) {
            const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
            payload = ticket.getPayload();
        } else {
            // Es un access_token proveniente de un custom button (useGoogleLogin)
            const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new AppError("Token de Google inválido o expirado.", 401);
            payload = await res.json();
        }

        const normalizedEmail = normalizeEmail(payload.email);
        
        // Buscamos primero por googleId, luego por email
        let usuario = await connectionManager.centralModels.Usuario.findOne({ where: { googleId: payload.sub } });
        
        if (!usuario) {
            usuario = await connectionManager.centralModels.Usuario.findOne({ where: { email: normalizedEmail } });
            
            if (!usuario) {
                throw new AppError(`Tu email de Google (${payload.email}) no está registrado en el sistema. Regístrate primero.`, 403);
            }
            
            // Auto-vincular si el email coincide (opcional pero muy útil)
            usuario.googleId = payload.sub;
            usuario.emailVerificado = true;
            usuario.verificationCode = null;
            usuario.verificationExpires = null;
            await usuario.save();
        } else if (!usuario.emailVerificado) {
            // Si inicia sesion con Google por primera vez estando desverificado, lo verificamos.
            usuario.emailVerificado = true;
            usuario.verificationCode = null;
            usuario.verificationExpires = null;
            await usuario.save();
        }

        if (!usuario.activo) throw new AppError("Usuario desactivado.", 401);

        const secret = process.env.JWT_SECRET;
        if (!secret) throw new AppError("Missing JWT_SECRET in environment", 401);
        
        const nuestroToken = jwt.sign(
            { id: usuario.id, negocioId: usuario.negocioId, rol: usuario.rol },
            secret,
            { expiresIn: "8h" }
        );

        return successResponse(res, 200, "Login con Google exitoso", {
            token: nuestroToken,
            usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, googleLinked: !!usuario.googleId }
        });
    } catch (error) {
        next(error);
    }
};

export const googleLink = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) throw new AppError("Token de Google no proporcionado.", 400);

        const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();

        // Verificar si otra cuenta ya usa este Google ID
        const exists = await connectionManager.centralModels.Usuario.findOne({ where: { googleId: payload.sub } });
        if (exists && exists.id !== req.user.id) {
            throw new AppError("Esta cuenta de Google ya está vinculada a otro usuario.", 400);
        }

        const usuario = await connectionManager.centralModels.Usuario.findByPk(req.user.id);
        usuario.googleId = payload.sub;
        await usuario.save();

        return successResponse(res, 200, "Cuenta de Google vinculada correctamente");
    } catch (error) {
        next(error);
    }
};

export const googleUnlink = async (req, res, next) => {
    try {
        const usuario = await connectionManager.centralModels.Usuario.findByPk(req.user.id);
        
        if (!usuario.passwordHash) {
            throw new AppError("No puedes desvincular Google porque no tienes una contraseña configurada.", 400);
        }

        usuario.googleId = null;
        await usuario.save();

        return successResponse(res, 200, "Cuenta de Google desvinculada");
    } catch (error) {
        next(error);
    }
};
