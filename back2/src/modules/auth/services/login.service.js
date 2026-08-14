import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class LoginService {
    /**
     * Helper para buscar Empleado y Negocio vinculados estrictamente desde PostgreSQL.
     * Si no se encuentran los registros requeridos, lanza un AppError explícito sin utilizar fallbacks hardcodeados.
     */
    async _getEmpleadoYNegocioStrict(usuario) {
        const { Negocio } = connectionManager.centralModels;
        
        if (!usuario || !usuario.empleadoId) {
            throw new AppError("El usuario no tiene un empleado vinculado en la base de datos.", 404, "EMPLOYEE_NOT_LINKED");
        }

        const negocios = await Negocio.findAll();
        let empleadoEncontrado = null;
        let negocioEncontrado = null;

        for (const neg of negocios) {
            try {
                const tenantDb = await connectionManager.getTenantDb(neg.id);
                const emp = await tenantDb.models.Empleado.findByPk(usuario.empleadoId);
                if (emp) {
                    empleadoEncontrado = emp;
                    negocioEncontrado = neg;
                    break;
                }
            } catch (err) {
                // Continuar si falla un tenant específico
            }
        }

        if (!empleadoEncontrado || !negocioEncontrado) {
            throw new AppError("No se encontró el registro de empleado o negocio en la base de datos.", 404, "TENANT_NOT_FOUND");
        }

        if (negocioEncontrado.activo === false) {
            throw new AppError("El negocio asociado se encuentra suspendido.", 403, "BUSINESS_SUSPENDED");
        }

        return { empleado: empleadoEncontrado, negocio: negocioEncontrado };
    }

    /**
     * Inicio de Sesión Local
     * Valida credenciales, estado activo y correo verificado (emailConfirmado = true),
     * obtiene los registros de Empleado y Negocio desde la DB y firma el JWT token.
     */
    async login({ email, password }) {
        const { Usuario, Rol } = connectionManager.centralModels;
        const userEmail = (email || "").trim().toLowerCase();

        const usuario = await Usuario.findOne({
            where: { email: userEmail },
            include: [{ model: Rol, as: "Roles", through: { attributes: [] } }]
        });

        if (!usuario || !usuario.activo) {
            throw new AppError("Credenciales inválidas. Por favor, verifica tu correo y contraseña.", 401, "INVALID_CREDENTIALS");
        }

        const userPassword = usuario.password || usuario.passwordHash;
        if (!userPassword) {
            throw new AppError("Esta cuenta fue registrada mediante Google OAuth. Inicia sesión con Google.", 400, "USE_GOOGLE_OAUTH");
        }

        const isMatch = await bcrypt.compare(password, userPassword);
        if (!isMatch) {
            throw new AppError("Credenciales inválidas. Por favor, verifica tu correo y contraseña.", 401, "INVALID_CREDENTIALS");
        }

        if (!usuario.emailConfirmado && !usuario.emailVerificado) {
            throw new AppError("Debes verificar tu email antes de ingresar.", 403, "EMAIL_NOT_VERIFIED");
        }

        const rolNombre = usuario.Roles && usuario.Roles.length > 0 ? usuario.Roles[0].nombre : "ADMIN";
        const secret = process.env.JWT_SECRET || "desarrollo_secret_key_lavanderia";

        // Caso especial para SUPER_ADMIN: No requiere Empleado ni Negocio
        if (rolNombre === "SUPER_ADMIN") {
            const token = jwt.sign(
                { email: usuario.email, rol: "SUPER_ADMIN" },
                secret,
                { expiresIn: "8h" }
            );

            return {
                token,
                usuario: {
                    email: usuario.email,
                    nombre: "Super Administrador",
                    rol: "SUPER_ADMIN",
                    googleLinked: Boolean(usuario.googleId)
                }
            };
        }

        // Obtener Empleado y Negocio de forma estricta desde PostgreSQL para roles normales
        const { empleado, negocio } = await this._getEmpleadoYNegocioStrict(usuario);

        // Registrar auditoría de sesión en el esquema tenant
        try {
            const tenantDb = await connectionManager.getTenantDb(negocio.id);
            await tenantDb.models.Sesion.create({
                fechaHoraInicio: new Date(),
                usuarioEmail: usuario.email
            });
        } catch (e) {
            // Ignore session logging error
        }

        const token = jwt.sign(
            {
                email: usuario.email,
                negocioId: negocio.id,
                empleadoId: empleado.id,
                rol: rolNombre
            },
            secret,
            { expiresIn: "8h" }
        );

        return {
            token,
            usuario: {
                id: empleado.id,
                email: usuario.email,
                nombre: `${empleado.nombre} ${empleado.apellido}`.trim(),
                rol: rolNombre,
                negocioId: negocio.id,
                googleLinked: Boolean(usuario.googleId)
            }
        };
    }

    /**
     * Autenticación con Google OAuth
     * Valida el idToken de Google y obtiene o vincula la cuenta del usuario.
     */
    async loginWithGoogle({ token, idToken }) {
        const { Usuario, Rol } = connectionManager.centralModels;
        const googleToken = token || idToken;

        if (!googleToken) {
            throw new AppError("Token de Google no proporcionado.", 400, "MISSING_GOOGLE_TOKEN");
        }

        let payload = null;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: googleToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            payload = ticket.getPayload();
        } catch (e) {
            if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
                const decoded = jwt.decode(googleToken);
                if (decoded && decoded.email) {
                    payload = decoded;
                }
            }
            if (!payload) {
                throw new AppError("Token de Google inválido o caducado.", 401, "INVALID_GOOGLE_TOKEN");
            }
        }

        const googleId = payload.sub || payload.id;
        const email = payload.email.toLowerCase();

        let usuario = await Usuario.findOne({
            where: { email },
            include: [{ model: Rol, as: "Roles", through: { attributes: [] } }]
        });

        if (!usuario) {
            throw new AppError("No existe una cuenta vinculada a este correo de Google. Regístrate previamente.", 404, "USER_NOT_FOUND");
        }

        if (!usuario.googleId) {
            usuario.googleId = googleId;
            usuario.emailConfirmado = true;
            await usuario.save();
        }

        if (!usuario.activo) {
            throw new AppError("Cuenta desactivada. Contacta al administrador.", 401, "USER_DISABLED");
        }

        const { empleado, negocio } = await this._getEmpleadoYNegocioStrict(usuario);
        const rolNombre = usuario.Roles && usuario.Roles.length > 0 ? usuario.Roles[0].nombre : "ADMIN";
        const secret = process.env.JWT_SECRET || "desarrollo_secret_key_lavanderia";

        const appToken = jwt.sign(
            {
                email: usuario.email,
                negocioId: negocio.id,
                empleadoId: empleado.id,
                rol: rolNombre
            },
            secret,
            { expiresIn: "8h" }
        );

        return {
            token: appToken,
            usuario: {
                id: empleado.id,
                email: usuario.email,
                nombre: `${empleado.nombre} ${empleado.apellido}`.trim(),
                rol: rolNombre,
                negocioId: negocio.id,
                googleLinked: true
            }
        };
    }
}

export const loginService = new LoginService();
