import bcrypt from "bcryptjs";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import { emailService } from "../../../utils/email.util.js";

class RegisterService {
    /**
     * Registro Público de Usuario Solicitante.
     * Guarda una SolicitudNegocio en estado PENDIENTE y notifica al Super Admin.
     */
    async register(data) {
        const { Usuario, SolicitudNegocio } = connectionManager.centralModels;
        
        if (!data.email || typeof data.email !== "string" || data.email.trim() === "") {
            throw new AppError("El campo 'email' es obligatorio.", 400, "MISSING_EMAIL");
        }
        if (!data.password || typeof data.password !== "string" || data.password.trim() === "") {
            throw new AppError("El campo 'password' es obligatorio.", 400, "MISSING_PASSWORD");
        }
        if (!data.usuarioNombre || typeof data.usuarioNombre !== "string" || data.usuarioNombre.trim() === "") {
            throw new AppError("El campo 'usuarioNombre' es obligatorio.", 400, "MISSING_USER_NAME");
        }
        if (!data.negocioNombre || typeof data.negocioNombre !== "string" || data.negocioNombre.trim() === "") {
            throw new AppError("El campo 'negocioNombre' es obligatorio.", 400, "MISSING_BUSINESS_NAME");
        }

        const email = data.email.trim().toLowerCase();
        const password = data.password;
        const usuarioNombre = data.usuarioNombre.trim();
        const negocioNombre = data.negocioNombre.trim();
        const cuit = data.cuit ? String(data.cuit).trim() : null;
        const subdominio = data.subdominio ? String(data.subdominio).trim().toLowerCase() : negocioNombre.toLowerCase().replace(/[^a-z0-9]/g, "");
        const telefono = data.telefono ? String(data.telefono).trim() : null;

        const usuarioExistente = await Usuario.findByPk(email);
        if (usuarioExistente) {
            throw new AppError("El correo electrónico ya se encuentra registrado activamente.", 409, "EMAIL_ALREADY_IN_USE");
        }

        if (SolicitudNegocio) {
            const solicitudPendiente = await SolicitudNegocio.findOne({
                where: { emailSolicitante: email, estado: "PENDIENTE" }
            });
            if (solicitudPendiente) {
                throw new AppError("Ya existe una solicitud de registro pendiente para este correo electrónico.", 409, "REQUEST_ALREADY_PENDING");
            }
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const nuevaSolicitud = await SolicitudNegocio.create({
            nombreNegocio: negocioNombre,
            subdominio,
            cuit,
            razonSocial: negocioNombre,
            nombreSolicitante: usuarioNombre,
            emailSolicitante: email,
            telefonoSolicitante: telefono,
            passwordHash,
            estado: "PENDIENTE"
        });

        await emailService.enviarNotificacionNuevaSolicitudSuperAdmin({
            id: nuevaSolicitud.id,
            nombreNegocio: nuevaSolicitud.nombreNegocio,
            nombreSolicitante: nuevaSolicitud.nombreSolicitante,
            emailSolicitante: nuevaSolicitud.emailSolicitante,
            telefonoSolicitante: nuevaSolicitud.telefonoSolicitante,
            cuit: nuevaSolicitud.cuit,
            razonSocial: nuevaSolicitud.razonSocial
        });

        return {
            mensaje: "Solicitud de apertura enviada exitosamente. Tu cuenta será activada una vez que el Super Admin apruebe el registro.",
            solicitud: {
                id: nuevaSolicitud.id,
                email: nuevaSolicitud.emailSolicitante,
                nombreNegocio: nuevaSolicitud.nombreNegocio,
                estado: nuevaSolicitud.estado
            }
        };
    }

    /**
     * Aprobación y Sustanciación de Negocio (Invocado únicamente por el Super Admin)
     */
    async sustanciarAprobacionNegocio(solicitudId, superadminEmail = "superadmin@sistema.com") {
        const { Usuario, Negocio, Rol, SolicitudNegocio } = connectionManager.centralModels;

        const solicitud = await SolicitudNegocio.findByPk(solicitudId);
        if (!solicitud) {
            throw new AppError("La solicitud de negocio no fue encontrada.", 404, "SOLICITUD_NOT_FOUND");
        }
        if (solicitud.estado !== "PENDIENTE") {
            throw new AppError(`La solicitud ya se encuentra en estado ${solicitud.estado}.`, 400, "INVALID_SOLICITUD_STATE");
        }

        let subdominioFinal = solicitud.subdominio ? solicitud.subdominio.toLowerCase().trim() : `negocio-${Date.now()}`;
        const existeNegocio = await Negocio.findOne({ where: { subdominio: subdominioFinal } });
        if (existeNegocio) {
            subdominioFinal = `${subdominioFinal}-${Math.floor(100 + Math.random() * 900)}`;
        }

        const nuevoNegocio = await Negocio.create({
            nombre: solicitud.nombreNegocio,
            razonSocial: solicitud.razonSocial ? solicitud.razonSocial : solicitud.nombreNegocio,
            subdominio: subdominioFinal,
            cuit: solicitud.cuit,
            facturacionHabilitada: false,
            activo: true,
            estadoSuscripcion: "PRUEBA",
            maxImagenes: 50,
            maxStorageGB: 1.0
        });

        let nuevoUsuario = await Usuario.findOne({ where: { email: solicitud.emailSolicitante.toLowerCase().trim() } });
        if (nuevoUsuario) {
            nuevoUsuario.password = solicitud.passwordHash;
            nuevoUsuario.negocioId = nuevoNegocio.id;
            nuevoUsuario.emailConfirmado = true;
            nuevoUsuario.activo = true;
            await nuevoUsuario.save();
        } else {
            const tokenConfirmacion = Math.floor(100000 + Math.random() * 900000).toString();
            nuevoUsuario = await Usuario.create({
                email: solicitud.emailSolicitante.toLowerCase().trim(),
                password: solicitud.passwordHash,
                negocioId: nuevoNegocio.id,
                tokenConfirmacion,
                emailConfirmado: true,
                activo: true
            });
        }

        let [rolAdmin] = await Rol.findOrCreate({
            where: { nombre: "ADMIN" },
            defaults: { nombre: "ADMIN", descripcion: "Rol de Administrador de Negocio" }
        });
        await nuevoUsuario.addRole(rolAdmin);

        const tenantContext = await connectionManager.getTenantDb(nuevoNegocio.id, true);

        const partesNombre = solicitud.nombreSolicitante.trim().split(" ");
        const nombrePila = partesNombre[0];
        const apellidoPila = partesNombre.slice(1).join(" ");

        const nuevoEmpleado = await tenantContext.models.Empleado.create({
            legajo: 1,
            nombre: nombrePila,
            apellido: apellidoPila,
            email: solicitud.emailSolicitante,
            telefono: solicitud.telefonoSolicitante,
            fechaAlta: new Date(),
            negocioId: nuevoNegocio.id,
            rol: "admin",
            activo: true
        });

        nuevoUsuario.empleadoId = nuevoEmpleado.id;
        await nuevoUsuario.save();

        solicitud.estado = "APROBADO";
        solicitud.fechaRevision = new Date();
        solicitud.revisadoPor = superadminEmail;
        await solicitud.save();

        await emailService.enviarResultadoSolicitudNegocio({
            email: solicitud.emailSolicitante,
            nombre: solicitud.nombreSolicitante,
            negocioNombre: solicitud.nombreNegocio,
            estado: "APROBADO"
        });

        const apellidoStr = nuevoEmpleado.apellido ? nuevoEmpleado.apellido : "";
        const nombreCompleto = apellidoStr ? `${nuevoEmpleado.nombre} ${apellidoStr}` : nuevoEmpleado.nombre;

        return {
            solicitud,
            negocio: nuevoNegocio,
            usuario: {
                id: nuevoEmpleado.id,
                email: nuevoUsuario.email,
                nombre: nombreCompleto,
                negocioId: nuevoNegocio.id
            }
        };
    }

    /**
     * Rechazo de Solicitud de Negocio por el Super Admin
     */
    async rechazarSolicitudNegocio(solicitudId, motivo = "", superadminEmail = "superadmin@sistema.com") {
        const { SolicitudNegocio } = connectionManager.centralModels;

        const solicitud = await SolicitudNegocio.findByPk(solicitudId);
        if (!solicitud) {
            throw new AppError("La solicitud de negocio no fue encontrada.", 404, "SOLICITUD_NOT_FOUND");
        }
        if (solicitud.estado !== "PENDIENTE") {
            throw new AppError(`La solicitud ya se encuentra en estado ${solicitud.estado}.`, 400, "INVALID_SOLICITUD_STATE");
        }

        solicitud.estado = "RECHAZADO";
        solicitud.motivoRechazo = motivo;
        solicitud.fechaRevision = new Date();
        solicitud.revisadoPor = superadminEmail;
        await solicitud.save();

        await emailService.enviarResultadoSolicitudNegocio({
            email: solicitud.emailSolicitante,
            nombre: solicitud.nombreSolicitante,
            negocioNombre: solicitud.nombreNegocio,
            estado: "RECHAZADO",
            motivoRechazo: motivo
        });

        return solicitud;
    }
}

export const registerService = new RegisterService();
