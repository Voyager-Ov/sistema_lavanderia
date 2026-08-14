import bcrypt from "bcryptjs";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import { emailService } from "../../../utils/email.util.js";

class RegisterService {
    /**
     * Registro de Administrador / Onboarding de Negocio
     * Aprovisiona la empresa en el esquema central, crea el usuario con contraseña hasheada,
     * inicializa el esquema Tenant en PostgreSQL y crea el primer empleado (legajo 1).
     * Todos los IDs y atributos retornados provienen exclusivamente de la base de datos.
     */
    async register(data) {
        const { Usuario, Negocio, Rol } = connectionManager.centralModels;
        
        const email = (data.email || "").trim().toLowerCase();
        const password = data.password;
        const usuarioNombre = (data.usuarioNombre || data.nombre || "").trim();
        const negocioNombre = (data.negocioNombre || data.razonSocial || "").trim();
        const cuit = data.cuit ? String(data.cuit).trim() : `20${Math.floor(10000000 + Math.random() * 90000000)}9`;
        const rolSolicitado = (data.rol || "ADMIN").toUpperCase();

        if (!email) {
            throw new AppError("El correo electrónico es requerido.", 400, "MISSING_EMAIL");
        }
        if (!password) {
            throw new AppError("La contraseña es requerida.", 400, "MISSING_PASSWORD");
        }
        if (!negocioNombre) {
            throw new AppError("El nombre del negocio o razón social es requerido.", 400, "MISSING_BUSINESS_NAME");
        }

        // 1. Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findByPk(email);
        if (usuarioExistente) {
            throw new AppError("El correo electrónico ya se encuentra registrado.", 409, "EMAIL_ALREADY_IN_USE");
        }

        // 2. Crear Negocio central en PostgreSQL
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
        await nuevoUsuario.addRole(rol);

        // 7. Aprovisionar esquema de Tenant
        const tenantContext = await connectionManager.getTenantDb(nuevoNegocio.id, true);

        // 8. Crear Empleado en Tenant
        const partesNombre = (usuarioNombre || "Admin").split(" ");
        const nombrePila = partesNombre[0] || "Admin";
        const apellidoPila = partesNombre.slice(1).join(" ") || "General";

        const nuevoEmpleado = await tenantContext.models.Empleado.create({
            legajo: 1,
            nombre: nombrePila,
            apellido: apellidoPila,
            telefono: "",
            fechaAlta: new Date(),
            negocioId: nuevoNegocio.id
        });

        // 9. Vincular Usuario con Empleado (clave foránea a nivel de BD)
        nuevoUsuario.empleadoId = nuevoEmpleado.id;
        await nuevoUsuario.save();

        // 10. Enviar email de verificación
        const nombreDestinatario = `${nombrePila} ${apellidoPila}`.trim();
        await emailService.enviarCodigoVerificacion(email, nombreDestinatario, tokenConfirmacion);

        return {
            tokenConfirmacion,
            usuario: {
                id: nuevoEmpleado.id,
                email: nuevoUsuario.email,
                nombre: `${nuevoEmpleado.nombre} ${nuevoEmpleado.apellido}`.trim(),
                rol: nombreRol,
                negocioId: nuevoNegocio.id
            }
        };
    }
}

export const registerService = new RegisterService();
