import bcrypt from "bcryptjs";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import { emailService } from "../../../utils/email.util.js";

class RegisterService {
    /**
     * Registro Público de Usuario Solicitante.
     * En lugar de aprovisionar el negocio automáticamente, guarda una SolicitudNegocio
     * en estado PENDIENTE y notifica al Super Admin.
     */
    async register(data) {
        const { Usuario, SolicitudNegocio } = connectionManager.centralModels;
        
        if (!data.email) {
            throw new AppError("El campo 'email' es obligatorio.", 400, "MISSING_EMAIL");
        }
        if (!data.password) {
            throw new AppError("El campo 'password' es obligatorio.", 400, "MISSING_PASSWORD");
        }
        if (!data.usuarioNombre) {
            throw new AppError("El campo 'usuarioNombre' es obligatorio.", 400, "MISSING_USER_NAME");
        }
        if (!data.negocioNombre) {
            throw new AppError("El campo 'negocioNombre' es obligatorio.", 400, "MISSING_BUSINESS_NAME");
        }

        const email = data.email.trim().toLowerCase();
        const password = data.password;
        const usuarioNombre = data.usuarioNombre.trim();
        const negocioNombre = data.negocioNombre.trim();
        const cuit = data.cuit ? String(data.cuit).trim() : `20${Math.floor(10000000 + Math.random() * 90000000)}9`;
        const subdominio = data.subdominio ? String(data.subdominio).trim().toLowerCase() : negocioNombre.toLowerCase().replace(/[^a-z0-9]/g, "");
        const telefono = data.telefono ? String(data.telefono).trim() : "";

        // 1. Verificar si el usuario ya existe activamente en central
        const usuarioExistente = await Usuario.findByPk(email);
        if (usuarioExistente) {
            throw new AppError("El correo electrónico ya se encuentra registrado activamente.", 409, "EMAIL_ALREADY_IN_USE");
        }

        // 2. Verificar si ya existe una solicitud PENDIENTE con este correo
        if (SolicitudNegocio) {
            const solicitudPendiente = await SolicitudNegocio.findOne({
                where: { emailSolicitante: email, estado: "PENDIENTE" }
            });
            if (solicitudPendiente) {
                throw new AppError("Ya existe una solicitud de registro pendiente para este correo electrónico.", 409, "REQUEST_ALREADY_PENDING");
            }
        }

        // 3. Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 4. Crear registro de SolicitudNegocio
        const nuevaSolicitud = await SolicitudNegocio.create({
            nombreNegocio: negocioNombre,
            subdominio: subdominio,
            cuit: cuit,
            razonSocial: negocioNombre,
            nombreSolicitante: usuarioNombre || "Solicitante",
            emailSolicitante: email,
            telefonoSolicitante: telefono,
            passwordHash: passwordHash,
            estado: "PENDIENTE"
        });

        // 5. Notificar al Super Admin por email
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
     * Crea el registro de Negocio central, aprovisiona la DB del Tenant en PostgreSQL,
     * crea la cuenta de Usuario Administrador y el primer Empleado.
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

        // 1. Crear Negocio central en PostgreSQL
        const nuevoNegocio = await Negocio.create({
            nombre: solicitud.nombreNegocio,
            razonSocial: solicitud.razonSocial || solicitud.nombreNegocio,
            subdominio: solicitud.subdominio,
            cuit: solicitud.cuit,
            facturacionHabilitada: false,
            activo: true,
            estadoSuscripcion: "PRUEBA",
            maxImagenes: 50,
            maxStorageGB: 1.0
        });

        // 2. Crear Usuario en esquema central con las credenciales ingresadas por el solicitante
        const tokenConfirmacion = Math.floor(100000 + Math.random() * 900000).toString();
        const nuevoUsuario = await Usuario.create({
            email: solicitud.emailSolicitante,
            password: solicitud.passwordHash,
            tokenConfirmacion,
            emailConfirmado: true, // Auto-confirmado por aprobación directa del Super Admin
            activo: true
        });

        // 3. Asignar Rol ADMIN
        let [rolAdmin] = await Rol.findOrCreate({
            where: { nombre: "ADMIN" },
            defaults: { nombre: "ADMIN", descripcion: "Rol de Administrador de Negocio" }
        });
        await nuevoUsuario.addRole(rolAdmin);

        // 4. Aprovisionar esquema de Tenant en PostgreSQL
        const tenantContext = await connectionManager.getTenantDb(nuevoNegocio.id, true);

        // 5. Crear Empleado en Tenant (Legajo 1)
        const partesNombre = (solicitud.nombreSolicitante || "Admin").split(" ");
        const nombrePila = partesNombre[0] || "Admin";
        const apellidoPila = partesNombre.slice(1).join(" ") || "General";

        const nuevoEmpleado = await tenantContext.models.Empleado.create({
            legajo: 1,
            nombre: nombrePila,
            apellido: apellidoPila,
            email: solicitud.emailSolicitante,
            telefono: solicitud.telefonoSolicitante || "",
            fechaAlta: new Date(),
            negocioId: nuevoNegocio.id,
            rol: "admin",
            activo: true
        });

        // 6. Vincular Usuario con Empleado
        nuevoUsuario.empleadoId = nuevoEmpleado.id;
        await nuevoUsuario.save();

        // 7. Actualizar estado de la solicitud
        solicitud.estado = "APROBADO";
        solicitud.fechaRevision = new Date();
        solicitud.revisadoPor = superadminEmail;
        await solicitud.save();

        // 8. Enviar correo de notificación de aprobación al usuario solicitante
        await emailService.enviarResultadoSolicitudNegocio({
            email: solicitud.emailSolicitante,
            nombre: solicitud.nombreSolicitante,
            negocioNombre: solicitud.nombreNegocio,
            estado: "APROBADO"
        });

        return {
            solicitud,
            negocio: nuevoNegocio,
            usuario: {
                id: nuevoEmpleado.id,
                email: nuevoUsuario.email,
                nombre: `${nuevoEmpleado.nombre} ${nuevoEmpleado.apellido}`.trim(),
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
