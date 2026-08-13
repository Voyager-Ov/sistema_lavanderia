import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import { emailService } from "../../../utils/email.util.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class AuthService {

    // Helper para buscar Empleado y Negocio vinculados a un Usuario
    async _getEmpleadoYNegocio(usuario) {
        const { Negocio } = connectionManager.centralModels;
        const negocios = await Negocio.findAll();
        
        let empleado = null;
        let negocioEncontrado = null;

        for (const neg of negocios) {
            try {
                const tenantDb = await connectionManager.getTenantDb(neg.id);
                if (usuario.empleadoId) {
                    const emp = await tenantDb.models.Empleado.findByPk(usuario.empleadoId);
                    if (emp) {
                        empleado = emp;
                        negocioEncontrado = neg;
                        break;
                    }
                }
            } catch (err) {
                // Continuar si falla un tenant
            }
        }

        // Si no se encontró negocio por Empleado, usar el primero disponible o un fallback
        if (!negocioEncontrado && negocios.length > 0) {
            negocioEncontrado = negocios[0];
        }

        return { empleado, negocio: negocioEncontrado };
    }

    // 1. Registro de Administrador / Usuario
    async register(data) {
        const { Usuario, Negocio, Rol } = connectionManager.centralModels;
        
        const email = (data.email || "").trim().toLowerCase();
        const password = data.password;
        const usuarioNombre = data.usuarioNombre || data.nombre || "Administrador";
        const negocioNombre = data.negocioNombre || data.razonSocial || "Mi Lavandería";
        const cuit = data.cuit || `20${Math.floor(10000000 + Math.random() * 90000000)}9`;
        const rolSolicitado = (data.rol || "ADMIN").toUpperCase();

        // 1. Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findByPk(email);
        if (usuarioExistente) {
            throw new AppError("El correo electrónico ya se encuentra registrado.", 409, "EMAIL_ALREADY_IN_USE");
        }

        // 2. Crear Negocio central
        const nuevoNegocio = await Negocio.create({
            razonSocial: negocioNombre,
            cuit: cuit,
            facturacionHabilitada: false
        });

        // 3. Hashear password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 4. Generar código de confirmación de 6 dígitos
        const tokenConfirmacion = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hs

        // 5. Crear Usuario en esquema central
        const nuevoUsuario = await Usuario.create({
            email,
            password: passwordHash,
            tokenConfirmacion,
            tokenConfirmacionExpires: tokenExpires,
            emailConfirmado: false,
            activo: true
        });

        // 6. Asignar Rol
        const nombreRol = (rolSolicitado === "ADMIN" || rolSolicitado === "ADMINISTRADOR") ? "ADMIN" : "EMPLEADO";
        let [rol] = await Rol.findOrCreate({
            where: { nombre: nombreRol },
            defaults: { nombre: nombreRol, descripcion: `Rol de ${nombreRol}` }
        });
        await nuevoUsuario.addRol(rol);

        // 7. Aprovisionar esquema de Tenant
        const tenantContext = await connectionManager.getTenantDb(nuevoNegocio.id, true);

        // 8. Crear Empleado en Tenant
        const partesNombre = usuarioNombre.trim().split(" ");
        const nombrePila = partesNombre[0] || usuarioNombre;
        const apellidoPila = partesNombre.slice(1).join(" ") || "Admin";

        const nuevoEmpleado = await tenantContext.models.Empleado.create({
            legajo: 1,
            nombre: nombrePila,
            apellido: apellidoPila,
            telefono: "",
            fechaAlta: new Date(),
            negocioId: nuevoNegocio.id
        });

        // 9. Vincular Usuario con Empleado
        nuevoUsuario.empleadoId = nuevoEmpleado.id;
        await nuevoUsuario.save();

        // 10. Enviar email de verificación
        await emailService.enviarCodigoVerificacion(email, nombrePila, tokenConfirmacion);

        return {
            tokenConfirmacion, // Para ambientes de test/dev si es necesario
            usuario: {
                id: nuevoEmpleado.id,
                email: nuevoUsuario.email,
                nombre: `${nombrePila} ${apellidoPila}`.trim(),
                rol: nombreRol,
                negocioId: nuevoNegocio.id
            }
        };
    }

    // 2. Confirmar Email con Código
    async verifyEmail({ email, code, token, tokenConfirmacion }) {
        const { Usuario } = connectionManager.centralModels;
        const userEmail = (email || "").trim().toLowerCase();
        const codigoIngresado = String(code || token || tokenConfirmacion || "").trim();

        const usuario = await Usuario.findByPk(userEmail);
        if (!usuario) {
            throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
        }

        if (usuario.emailConfirmado) {
            return { message: "El correo electrónico ya fue verificado previamente." };
        }

        if (!usuario.tokenConfirmacion || usuario.tokenConfirmacion !== codigoIngresado) {
            throw new AppError("El código de verificación es inválido.", 400, "INVALID_CODE");
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

    // 3. Reenviar Código de Verificación
    async resendVerification(email) {
        const { Usuario } = connectionManager.centralModels;
        const userEmail = (email || "").trim().toLowerCase();

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

        const { empleado } = await this._getEmpleadoYNegocio(usuario);
        const nombre = empleado ? empleado.nombre : userEmail.split("@")[0];

        await emailService.enviarCodigoVerificacion(userEmail, nombre, tokenConfirmacion);

        return { message: "Código de verificación reenviado exitosamente." };
    }

    // 4. Inicio de Sesión Local
    async login({ email, password }) {
        const { Usuario, Rol } = connectionManager.centralModels;
        const userEmail = (email || "").trim().toLowerCase();

        const usuario = await Usuario.findOne({
            where: { email: userEmail },
            include: [{ model: Rol, through: { attributes: [] } }]
        });

        if (!usuario || !usuario.activo) {
            throw new AppError("Credenciales inválidas. Por favor, verifica tu correo y contraseña.", 401, "INVALID_CREDENTIALS");
        }

        if (!usuario.password) {
            throw new AppError("Esta cuenta fue registrada mediante Google OAuth. Inicia sesión con Google.", 400, "USE_GOOGLE_OAUTH");
        }

        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            throw new AppError("Credenciales inválidas. Por favor, verifica tu correo y contraseña.", 401, "INVALID_CREDENTIALS");
        }

        if (!usuario.emailConfirmado) {
            throw new AppError("Debes verificar tu email antes de ingresar.", 403, "EMAIL_NOT_VERIFIED");
        }

        const { empleado, negocio } = await this._getEmpleadoYNegocio(usuario);

        // Si hay tenantDb, registrar la sesión
        if (negocio) {
            try {
                const tenantDb = await connectionManager.getTenantDb(negocio.id);
                await tenantDb.models.Sesion.create({
                    fechaHoraInicio: new Date(),
                    usuarioEmail: usuario.email
                });
            } catch (e) {
                // ignore session logging error
            }
        }

        const rolNombre = usuario.Roles && usuario.Roles.length > 0 ? usuario.Roles[0].nombre : "ADMIN";
        const secret = process.env.JWT_SECRET || "desarrollo_secret_key_lavanderia";

        const token = jwt.sign(
            {
                email: usuario.email,
                negocioId: negocio ? negocio.id : 1,
                empleadoId: usuario.empleadoId,
                rol: rolNombre
            },
            secret,
            { expiresIn: "8h" }
        );

        const nombreUsuario = empleado ? `${empleado.nombre} ${empleado.apellido}`.trim() : usuario.email.split("@")[0];

        return {
            token,
            usuario: {
                id: usuario.empleadoId || 1,
                email: usuario.email,
                nombre: nombreUsuario,
                rol: rolNombre,
                negocioId: negocio ? negocio.id : 1,
                googleLinked: Boolean(usuario.googleId)
            }
        };
    }

    // 5. Autenticación con Google OAuth
    async loginWithGoogle({ token, idToken }) {
        const googleToken = token || idToken;
        if (!googleToken) {
            throw new AppError("El token de Google es requerido.", 400, "MISSING_TOKEN");
        }

        let payload = null;
        try {
            if (process.env.GOOGLE_CLIENT_ID) {
                const ticket = await googleClient.verifyIdToken({
                    idToken: googleToken,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                payload = ticket.getPayload();
            } else {
                // Fallback para pruebas/desarrollo sin GOOGLE_CLIENT_ID configurado
                const decoded = jwt.decode(googleToken);
                payload = decoded || { sub: `google_${Date.now()}`, email: "google.user@example.com", name: "Usuario Google" };
            }
        } catch (err) {
            throw new AppError("El token de Google es inválido o ha expirado.", 401, "INVALID_GOOGLE_TOKEN");
        }

        const googleId = payload.sub || payload.googleId;
        const email = (payload.email || "").toLowerCase();
        const { Usuario, Rol } = connectionManager.centralModels;

        let usuario = await Usuario.findOne({
            where: { googleId },
            include: [{ model: Rol, through: { attributes: [] } }]
        });

        if (!usuario) {
            // Intentar vincular por email
            usuario = await Usuario.findOne({
                where: { email },
                include: [{ model: Rol, through: { attributes: [] } }]
            });

            if (!usuario) {
                throw new AppError("No existe una cuenta vinculada a este usuario de Google. Por favor, regístrate primero.", 404, "USER_NOT_FOUND");
            }

            usuario.googleId = googleId;
            await usuario.save();
        }

        if (!usuario.activo) {
            throw new AppError("Tu cuenta se encuentra inactiva.", 401, "USER_DISABLED");
        }

        const { empleado, negocio } = await this._getEmpleadoYNegocio(usuario);
        const rolNombre = usuario.Roles && usuario.Roles.length > 0 ? usuario.Roles[0].nombre : "ADMIN";
        const secret = process.env.JWT_SECRET || "desarrollo_secret_key_lavanderia";

        const appToken = jwt.sign(
            {
                email: usuario.email,
                negocioId: negocio ? negocio.id : 1,
                empleadoId: usuario.empleadoId,
                rol: rolNombre
            },
            secret,
            { expiresIn: "8h" }
        );

        const nombreUsuario = empleado ? `${empleado.nombre} ${empleado.apellido}`.trim() : (payload.name || usuario.email.split("@")[0]);

        return {
            token: appToken,
            usuario: {
                id: usuario.empleadoId || 1,
                email: usuario.email,
                nombre: nombreUsuario,
                rol: rolNombre,
                negocioId: negocio ? negocio.id : 1,
                googleLinked: true
            }
        };
    }

    // 6. Olvidé mi Contraseña
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

        // Respuesta genérica siempre para evitar enumeración de cuentas
        return { message: "Si el correo ingresado coincide con una cuenta activa, recibirás las instrucciones para restablecer tu contraseña." };
    }

    // 7. Restablecer Contraseña
    async resetPassword({ token, newPassword, password }) {
        const { Usuario } = connectionManager.centralModels;
        const resetToken = (token || "").trim();
        const nuevaClave = newPassword || password;

        if (!resetToken) {
            throw new AppError("El token de restablecimiento es requerido.", 400, "MISSING_TOKEN");
        }

        const usuario = await Usuario.findOne({ where: { tokenConfirmacion: resetToken } });
        if (!usuario) {
            throw new AppError("El enlace de restablecimiento es inválido o ha expirado.", 400, "INVALID_TOKEN");
        }

        if (usuario.tokenConfirmacionExpires && new Date() > new Date(usuario.tokenConfirmacionExpires)) {
            throw new AppError("El enlace de restablecimiento ha expirado.", 400, "EXPIRED_TOKEN");
        }

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(nuevaClave, salt);
        usuario.tokenConfirmacion = null;
        usuario.tokenConfirmacionExpires = null;
        await usuario.save();

        return { message: "Contraseña actualizada exitosamente." };
    }

    // 8. Cambiar Contraseña (Sesión Activa)
    async changePassword(email, oldPassword, newPassword) {
        const { Usuario } = connectionManager.centralModels;
        const userEmail = (email || "").trim().toLowerCase();

        const usuario = await Usuario.findByPk(userEmail);
        if (!usuario) {
            throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
        }

        if (!usuario.password) {
            throw new AppError("Tu cuenta está vinculada únicamente con Google OAuth y no posee contraseña asignada.", 400, "GOOGLE_ONLY_ACCOUNT");
        }

        const isMatch = await bcrypt.compare(oldPassword, usuario.password);
        if (!isMatch) {
            throw new AppError("La contraseña actual es incorrecta.", 400, "INVALID_OLD_PASSWORD");
        }

        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(newPassword, salt);
        await usuario.save();

        return { message: "Contraseña cambiada exitosamente." };
    }

    // 9. Obtener Perfil del Usuario Activo
    async getProfile(email) {
        const { Usuario, Rol } = connectionManager.centralModels;
        const userEmail = (email || "").trim().toLowerCase();

        const usuario = await Usuario.findOne({
            where: { email: userEmail },
            include: [{ model: Rol, through: { attributes: [] } }]
        });

        if (!usuario) {
            throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
        }

        const { empleado, negocio } = await this._getEmpleadoYNegocio(usuario);
        const rolNombre = usuario.Roles && usuario.Roles.length > 0 ? usuario.Roles[0].nombre : "ADMIN";
        const nombreUsuario = empleado ? `${empleado.nombre} ${empleado.apellido}`.trim() : usuario.email.split("@")[0];

        return {
            usuario: {
                id: usuario.empleadoId || 1,
                email: usuario.email,
                nombre: nombreUsuario,
                rol: rolNombre,
                negocioId: negocio ? negocio.id : 1,
                googleLinked: Boolean(usuario.googleId)
            }
        };
    }
}

export const authService = new AuthService();
