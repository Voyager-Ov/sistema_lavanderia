import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import bcrypt from "bcryptjs";

class EmpleadosService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    async obtenerEmpleados(negocioId, query = {}) {
        if (!negocioId) throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        const { Empleado } = await this._getModels(negocioId);

        const limit = parseInt(query.limit) || 50;
        const page = parseInt(query.page) || 1;
        const offset = (page - 1) * limit;

        const { count, rows } = await Empleado.findAndCountAll({
            order: [["id", "ASC"]],
            limit,
            offset
        });

        return {
            items: rows,
            meta: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page
            }
        };
    }

    async crearEmpleado(negocioId, data) {
        if (!negocioId) throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        const { Empleado } = await this._getModels(negocioId);
        const centralModels = connectionManager.centralModels;

        if (!data.nombre || !data.email) {
            throw new AppError("Nombre y email son requeridos.", 400, "MISSING_REQUIRED_FIELDS");
        }

        const emailLower = data.email.toLowerCase().trim();

        // Verificar si ya existe usuario central
        const existeUsuario = await centralModels.Usuario.findOne({ where: { email: emailLower } });
        if (existeUsuario) {
            throw new AppError("El email ya se encuentra registrado en el sistema.", 400, "EMAIL_ALREADY_EXISTS");
        }

        const passRaw = data.password || "lavanderia123";
        const passwordHash = await bcrypt.hash(passRaw, 10);

        // Crear credencial en base de datos central
        const nuevoUsuario = await centralModels.Usuario.create({
            email: emailLower,
            password: passwordHash,
            emailConfirmado: true,
            activo: true,
            negocioId: negocioId
        });

        // Vincular rol central
        const rolNombre = (data.rol || "empleado").toLowerCase();
        const rolNombreUpper = rolNombre.toUpperCase();
        const [rol] = await centralModels.Rol.findOrCreate({
            where: { nombre: rolNombreUpper },
            defaults: { nombre: rolNombreUpper, descripcion: `Rol ${rolNombreUpper}` }
        });
        if (rol) {
            await nuevoUsuario.addRole(rol);
        }

        // Crear legajo local de empleado en base de datos del tenant
        const nuevoEmpleado = await Empleado.create({
            nombre: data.nombre.trim(),
            email: emailLower,
            telefono: data.telefono || null,
            rol: rolNombre,
            activo: true,
            sueldoBase: parseFloat(data.sueldoBase) || 0,
            horasSemanalesObjetivo: parseInt(data.horasSemanalesObjetivo) || 40,
            usuarioIdCentral: nuevoUsuario.id
        });

        // Vincular empleadoId en el registro de Usuario central
        nuevoUsuario.empleadoId = nuevoEmpleado.id;
        await nuevoUsuario.save();

        return nuevoEmpleado;
    }

    async obtenerEmpleadoPorId(negocioId, id) {
        if (!negocioId) throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        const { Empleado } = await this._getModels(negocioId);

        const empleado = await Empleado.findByPk(id);
        if (!empleado) throw new AppError("Empleado no encontrado.", 404, "EMPLOYEE_NOT_FOUND");
        return empleado;
    }

    async actualizarEmpleado(negocioId, id, data) {
        if (!negocioId) throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        const { Empleado } = await this._getModels(negocioId);
        const centralModels = connectionManager.centralModels;

        const empleado = await Empleado.findByPk(id);
        if (!empleado) throw new AppError("Empleado no encontrado.", 404, "EMPLOYEE_NOT_FOUND");

        const updateFields = {};
        if (data.nombre) updateFields.nombre = data.nombre.trim();
        if (data.telefono !== undefined) updateFields.telefono = data.telefono ? data.telefono.trim() : null;
        if (data.rol) updateFields.rol = data.rol.toLowerCase();
        if (data.sueldoBase !== undefined) updateFields.sueldoBase = parseFloat(data.sueldoBase);
        if (data.horasSemanalesObjetivo !== undefined) updateFields.horasSemanalesObjetivo = parseInt(data.horasSemanalesObjetivo);

        await empleado.update(updateFields);

        // Buscar registro de usuario central vinculado para actualizar clave o rol si fueron enviados
        let usuarioCentral = null;
        if (empleado.usuarioIdCentral) {
            usuarioCentral = await centralModels.Usuario.findByPk(empleado.usuarioIdCentral);
        } else if (empleado.email) {
            usuarioCentral = await centralModels.Usuario.findOne({ where: { email: empleado.email } });
        }

        if (usuarioCentral) {
            // Actualizar contraseña si fue proporcionada y es válida
            if (data.password && data.password.trim().length >= 6) {
                const passwordHash = await bcrypt.hash(data.password.trim(), 10);
                usuarioCentral.password = passwordHash;
                await usuarioCentral.save();
            }

            // Sincronizar rol en base central
            if (data.rol) {
                const rolNombre = data.rol.toLowerCase() === "admin" ? "admin" : "empleado";
                const rolObj = await centralModels.Rol.findOne({ where: { nombre: rolNombre } });
                if (rolObj) {
                    await centralModels.UsuarioRoles.destroy({ where: { usuarioId: usuarioCentral.id } });
                    await centralModels.UsuarioRoles.create({ usuarioId: usuarioCentral.id, rolId: rolObj.id });
                }
            }
        }

        return empleado;
    }
}

export const empleadosService = new EmpleadosService();
