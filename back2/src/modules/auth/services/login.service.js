import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import { getJwtSecret } from "../../../config/env.config.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class LoginService {
    /**
     * Helper para buscar Empleado y Negocio vinculados estrictamente desde PostgreSQL.
     * Si no se encuentran los registros requeridos, lanza un AppError explícito sin utilizar fallbacks hardcodeados.
     */
    async _getEmpleadoYNegocioStrict(usuario) {
        const { Negocio } = connectionManager.centralModels;
        
        if (!usuario) {
            throw new AppError("Usuario no especificado.", 400, "MISSING_USER");
        }

        const emailLower = usuario.email ? usuario.email.toLowerCase().trim() : "";
        let empleadoEncontrado = null;
        let negocioEncontrado = null;

        // 1. Vía Rápida: Si el usuario ya tiene su negocioId asignado directamente en DB Central
        if (usuario.negocioId) {
            negocioEncontrado = await Negocio.findByPk(usuario.negocioId);
            if (negocioEncontrado) {
                try {
                    const tenantDb = await connectionManager.getTenantDb(negocioEncontrado.id);
                    if (usuario.empleadoId) {
                        empleadoEncontrado = await tenantDb.models.Empleado.findByPk(usuario.empleadoId);
                    }
                    if (!empleadoEncontrado && emailLower) {
                        empleadoEncontrado = await tenantDb.models.Empleado.findOne({ where: { email: emailLower } });
                    }
                } catch (err) {}
            }
        }

        // 2. Vía Fallback (Búsqueda Inicial): Si negocioId aún no estaba asignado
        if (!empleadoEncontrado || !negocioEncontrado) {
            const negocios = await Negocio.findAll({ order: [["id", "ASC"]] });

            if (emailLower) {
                for (const neg of negocios) {
                    try {
                        const tenantDb = await connectionManager.getTenantDb(neg.id);
                        const emp = await tenantDb.models.Empleado.findOne({ where: { email: emailLower } });
                        if (emp) {
                            empleadoEncontrado = emp;
                            negocioEncontrado = neg;
                            usuario.empleadoId = emp.id;
                            usuario.negocioId = neg.id;
                            await usuario.save().catch(() => {});
                            break;
                        }
                    } catch (err) {}
                }
            }

            if (!empleadoEncontrado && usuario.empleadoId) {
                for (const neg of negocios) {
                    try {
                        const tenantDb = await connectionManager.getTenantDb(neg.id);
                        const emp = await tenantDb.models.Empleado.findByPk(usuario.empleadoId);
                        if (emp) {
                            empleadoEncontrado = emp;
                            negocioEncontrado = neg;
                            usuario.negocioId = neg.id;
                            await usuario.save().catch(() => {});
                            break;
                        }
                    } catch (err) {}
                }
            }
        }

        if (!empleadoEncontrado || !negocioEncontrado) {
            throw new AppError("El usuario no tiene un empleado vinculado en la base de datos.", 404, "EMPLOYEE_NOT_LINKED");
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
        if (!email) {
            throw new AppError("El campo 'email' es obligatorio.", 400, "MISSING_EMAIL");
        }
        if (!password) {
            throw new AppError("El campo 'password' es obligatorio.", 400, "MISSING_PASSWORD");
        }

        const { Usuario, Rol } = connectionManager.centralModels;
        const userEmail = email.trim().toLowerCase();

        const usuario = await Usuario.findOne({
            where: { email: userEmail },
            include: [{ model: Rol, as: "Roles", through: { attributes: [] } }]
        });

        if (!usuario) {
            const { SolicitudNegocio } = connectionManager.centralModels;
            if (SolicitudNegocio) {
                const solicitud = await SolicitudNegocio.findOne({
                    where: { emailSolicitante: userEmail }
                });
                if (solicitud) {
                    const isMatch = await bcrypt.compare(password, solicitud.passwordHash).catch(() => false);
                    if (isMatch) {
                        if (solicitud.estado === "PENDIENTE") {
                            throw new AppError(
                                "Tu solicitud de apertura de negocio aún está en revisión por el Super Admin.",
                                403,
                                "REGISTRATION_PENDING",
                                { solicitud: { id: solicitud.id, nombreNegocio: solicitud.nombreNegocio, estado: solicitud.estado, createdAt: solicitud.createdAt } }
                            );
                        } else if (solicitud.estado === "RECHAZADO") {
                            const motivoStr = solicitud.motivoRechazo ? solicitud.motivoRechazo : "No especificado";
                            throw new AppError(
                                `Tu solicitud de apertura de negocio fue rechazada. Motivo: ${motivoStr}`,
                                403,
                                "REGISTRATION_REJECTED",
                                { solicitud: { id: solicitud.id, nombreNegocio: solicitud.nombreNegocio, estado: solicitud.estado, motivoRechazo: solicitud.motivoRechazo } }
                            );
                        }
                    }
                }
            }
            throw new AppError("Credenciales inválidas. Por favor, verifica tu correo y contraseña.", 401, "INVALID_CREDENTIALS");
        }

        if (!usuario.activo) {
            throw new AppError("Tu cuenta de usuario se encuentra desactivada.", 403, "USER_DISABLED");
        }

        const userPassword = usuario.password;
        if (!userPassword) {
            throw new AppError("Esta cuenta fue registrada mediante Google OAuth. Inicia sesión con Google.", 400, "USE_GOOGLE_OAUTH");
        }

        const isMatch = await bcrypt.compare(password, userPassword);
        if (!isMatch) {
            throw new AppError("Credenciales inválidas. Por favor, verifica tu correo y contraseña.", 401, "INVALID_CREDENTIALS");
        }

        if (!usuario.emailConfirmado) {
            throw new AppError("Debes verificar tu email antes de ingresar.", 403, "EMAIL_NOT_VERIFIED");
        }

        if (usuario.Roles && usuario.Roles.length > 0 && usuario.Roles[0].nombre === "SUPER_ADMIN") {
            const secret = getJwtSecret();
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

        const { empleado, negocio } = await this._getEmpleadoYNegocioStrict(usuario);

        let rolNombre = "EMPLEADO";
        if (usuario.Roles && usuario.Roles.length > 0 && usuario.Roles[0].nombre) {
            rolNombre = usuario.Roles[0].nombre.toUpperCase();
        } else if (empleado && empleado.rol) {
            rolNombre = empleado.rol.toUpperCase();
        }

        try {
            const tenantDb = await connectionManager.getTenantDb(negocio.id);
            await tenantDb.models.Sesion.create({
                fechaHoraInicio: new Date(),
                usuarioEmail: usuario.email
            });
        } catch (e) {
            console.error("⚠️ [Session Audit Error]:", e.message);
        }

        const secret = getJwtSecret();
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

        const apellidoStr = empleado.apellido ? empleado.apellido : "";
        const nombreCompleto = apellidoStr ? `${empleado.nombre} ${apellidoStr}` : empleado.nombre;

        return {
            token,
            usuario: {
                id: empleado.id,
                email: usuario.email,
                nombre: nombreCompleto,
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
    async loginWithGoogle({ idToken }) {
        if (!idToken) {
            throw new AppError("El campo 'idToken' es obligatorio para la autenticación con Google.", 400, "MISSING_GOOGLE_ID_TOKEN");
        }
        const { Usuario, Rol } = connectionManager.centralModels;

        let payload = null;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            payload = ticket.getPayload();
        } catch (e) {
            throw new AppError("Token de Google inválido o caducado.", 401, "INVALID_GOOGLE_TOKEN");
        }

        const googleId = payload.sub;
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

        let rolNombre = "EMPLEADO";
        if (usuario.Roles && usuario.Roles.length > 0 && usuario.Roles[0].nombre) {
            rolNombre = usuario.Roles[0].nombre.toUpperCase();
        } else if (empleado && empleado.rol) {
            rolNombre = empleado.rol.toUpperCase();
        }

        const secret = getJwtSecret();
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

        const apellidoStr = empleado.apellido ? empleado.apellido : "";
        const nombreCompleto = apellidoStr ? `${empleado.nombre} ${apellidoStr}` : empleado.nombre;

        return {
            token: appToken,
            usuario: {
                id: empleado.id,
                email: usuario.email,
                nombre: nombreCompleto,
                rol: rolNombre,
                negocioId: negocio.id,
                googleLinked: true
            }
        };
    }
}

export const loginService = new LoginService();
