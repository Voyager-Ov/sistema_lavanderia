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
        if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        const { Empleado } = await this._getModels(negocioId);
        const centralModels = connectionManager.centralModels;

        if (!data.nombre || typeof data.nombre !== "string" || !data.nombre.trim()) {
            throw new AppError("El nombre del empleado es obligatorio.", 400, "MISSING_NAME");
        }

        if (!data.email || typeof data.email !== "string" || !data.email.includes("@")) {
            throw new AppError("Un correo electrónico válido es obligatorio.", 400, "INVALID_EMAIL");
        }

        if (!data.password || typeof data.password !== "string" || data.password.trim().length < 6) {
            throw new AppError("La contraseña es obligatoria y debe tener al menos 6 caracteres.", 400, "INVALID_PASSWORD");
        }

        const emailLower = data.email.toLowerCase().trim();

        // Verificar si ya existe usuario central
        const existeUsuario = await centralModels.Usuario.findOne({ where: { email: emailLower } });
        if (existeUsuario) {
            throw new AppError("El email ya se encuentra registrado en el sistema.", 400, "EMAIL_ALREADY_EXISTS");
        }

        const passwordHash = await bcrypt.hash(data.password.trim(), 10);

        // Crear credencial en base de datos central
        const nuevoUsuario = await centralModels.Usuario.create({
            email: emailLower,
            password: passwordHash,
            emailConfirmado: true,
            activo: true,
            negocioId: negocioId
        });

        if (!data.rol || typeof data.rol !== "string" || !data.rol.trim()) {
            throw new AppError("El rol del empleado es obligatorio.", 400, "MISSING_ROLE");
        }

        // Vincular rol central
        const rolNombre = data.rol.toLowerCase().trim();
        const rolNombreUpper = rolNombre.toUpperCase();
        const [rol] = await centralModels.Rol.findOrCreate({
            where: { nombre: rolNombreUpper },
            defaults: { nombre: rolNombreUpper, descripcion: `Rol ${rolNombreUpper}` }
        });
        if (rol) {
            await nuevoUsuario.addRole(rol);
        }

        const sueldoBase = data.sueldoBase !== undefined && data.sueldoBase !== null && data.sueldoBase !== "" 
            ? parseFloat(data.sueldoBase) 
            : 0;
        if (isNaN(sueldoBase) || sueldoBase < 0) {
            throw new AppError("El sueldo base debe ser un monto numérico válido mayor o igual a 0.", 400, "INVALID_SUELDO");
        }

        const horasSemanalesObjetivo = data.horasSemanalesObjetivo !== undefined && data.horasSemanalesObjetivo !== null && data.horasSemanalesObjetivo !== ""
            ? parseInt(data.horasSemanalesObjetivo)
            : 40;
        if (isNaN(horasSemanalesObjetivo) || horasSemanalesObjetivo <= 0) {
            throw new AppError("Las horas semanales objetivo deben ser un número entero positivo.", 400, "INVALID_HORAS");
        }

        // Crear legajo local de empleado en base de datos del tenant
        const nuevoEmpleado = await Empleado.create({
            nombre: data.nombre.trim(),
            email: emailLower,
            telefono: data.telefono ? data.telefono.trim() : null,
            rol: rolNombre,
            activo: true,
            sueldoBase,
            horasSemanalesObjetivo,
            usuarioIdCentral: nuevoUsuario.id
        });

        // Vincular empleadoId en el registro de Usuario central
        nuevoUsuario.empleadoId = nuevoEmpleado.id;
        await nuevoUsuario.save();

        return nuevoEmpleado;
    }

    async obtenerEmpleadoPorId(negocioId, id) {
        if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        const { Empleado } = await this._getModels(negocioId);

        const idNum = parseInt(id);
        if (isNaN(idNum) || idNum <= 0) throw new AppError("ID de empleado inválido.", 400, "INVALID_ID");

        const empleado = await Empleado.findByPk(idNum);
        if (!empleado) throw new AppError("Empleado no encontrado.", 404, "EMPLOYEE_NOT_FOUND");
        return empleado;
    }

    async actualizarEmpleado(negocioId, id, data) {
        if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        const { Empleado } = await this._getModels(negocioId);
        const centralModels = connectionManager.centralModels;

        const idNum = parseInt(id);
        if (isNaN(idNum) || idNum <= 0) throw new AppError("ID de empleado inválido.", 400, "INVALID_ID");

        const empleado = await Empleado.findByPk(idNum);
        if (!empleado) throw new AppError("Empleado no encontrado.", 404, "EMPLOYEE_NOT_FOUND");

        const updateFields = {};
        if (data.nombre !== undefined) {
            if (typeof data.nombre !== "string" || !data.nombre.trim()) {
                throw new AppError("El nombre del empleado no puede estar vacío.", 400, "INVALID_NAME");
            }
            updateFields.nombre = data.nombre.trim();
        }

        if (data.telefono !== undefined) {
            updateFields.telefono = data.telefono && typeof data.telefono === "string" ? data.telefono.trim() : null;
        }

        if (data.rol !== undefined) {
            updateFields.rol = data.rol.toLowerCase().trim();
        }

        if (data.sueldoBase !== undefined && data.sueldoBase !== null && data.sueldoBase !== "") {
            const sueldo = parseFloat(data.sueldoBase);
            if (isNaN(sueldo) || sueldo < 0) {
                throw new AppError("El sueldo base debe ser un monto numérico válido mayor o igual a 0.", 400, "INVALID_SUELDO");
            }
            updateFields.sueldoBase = sueldo;
        }

        if (data.horasSemanalesObjetivo !== undefined && data.horasSemanalesObjetivo !== null && data.horasSemanalesObjetivo !== "") {
            const horas = parseInt(data.horasSemanalesObjetivo);
            if (isNaN(horas) || horas <= 0) {
                throw new AppError("Las horas semanales objetivo deben ser un entero positivo.", 400, "INVALID_HORAS");
            }
            updateFields.horasSemanalesObjetivo = horas;
        }

        await empleado.update(updateFields);

        // Actualizar usuario central mediante FK usuarioIdCentral
        if (empleado.usuarioIdCentral) {
            const usuarioCentral = await centralModels.Usuario.findByPk(empleado.usuarioIdCentral);
            if (usuarioCentral) {
                if (data.password && typeof data.password === "string" && data.password.trim().length >= 6) {
                    usuarioCentral.password = await bcrypt.hash(data.password.trim(), 10);
                    await usuarioCentral.save();
                }

                if (data.rol) {
                    const rolNombreUpper = data.rol.toUpperCase().trim();
                    const rolObj = await centralModels.Rol.findOne({ where: { nombre: rolNombreUpper } });
                    if (rolObj) {
                        await centralModels.UsuarioRoles.destroy({ where: { usuarioId: usuarioCentral.id } });
                        await centralModels.UsuarioRoles.create({ usuarioId: usuarioCentral.id, rolId: rolObj.id });
                    }
                }
            }
        }

        return empleado;
    }
}

export const empleadosService = new EmpleadosService();
