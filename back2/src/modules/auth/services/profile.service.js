import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class ProfileService {
    /**
     * Helper para buscar Empleado y Negocio vinculados estrictamente desde PostgreSQL.
     * Si no se encuentran los registros requeridos, lanza un AppError explícito sin utilizar fallbacks hardcodeados.
     */
    async _getEmpleadoYNegocioStrict(usuario) {
        const { Negocio } = connectionManager.centralModels;
        
        if (!usuario) {
            throw new AppError("Usuario no especificado.", 400, "MISSING_USER");
        }

        const negocios = await Negocio.findAll();
        let empleadoEncontrado = null;
        let negocioEncontrado = null;

        if (usuario.empleadoId) {
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
        }

        if (!empleadoEncontrado && usuario.email) {
            const emailLower = usuario.email.toLowerCase().trim();
            for (const neg of negocios) {
                try {
                    const tenantDb = await connectionManager.getTenantDb(neg.id);
                    const emp = await tenantDb.models.Empleado.findOne({
                        where: { email: emailLower }
                    });
                    if (emp) {
                        empleadoEncontrado = emp;
                        negocioEncontrado = neg;
                        usuario.empleadoId = emp.id;
                        await usuario.save();
                        break;
                    }
                } catch (err) {
                    // Continuar
                }
            }
        }

        if (!empleadoEncontrado || !negocioEncontrado) {
            throw new AppError("El usuario no tiene un empleado vinculado en la base de datos.", 404, "EMPLOYEE_NOT_LINKED");
        }

        return { empleado: empleadoEncontrado, negocio: negocioEncontrado };
    }

    /**
     * Obtener Perfil del Usuario Activo (GET /api/auth/me)
     */
    async getProfile(email) {
        const { Usuario, Rol } = connectionManager.centralModels;
        const userEmail = (email || "").trim().toLowerCase();

        const usuario = await Usuario.findOne({
            where: { email: userEmail },
            include: [{ model: Rol, as: "Roles", through: { attributes: [] } }]
        });

        if (!usuario) {
            throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
        }

        const { empleado, negocio } = await this._getEmpleadoYNegocioStrict(usuario);
        
        let rolNombre = "EMPLEADO";
        if (usuario.Roles && usuario.Roles.length > 0 && usuario.Roles[0].nombre) {
            rolNombre = usuario.Roles[0].nombre.toUpperCase();
        } else if (empleado && empleado.rol) {
            rolNombre = empleado.rol.toUpperCase();
        }

        return {
            usuario: {
                id: empleado.id,
                email: usuario.email,
                nombre: `${empleado.nombre} ${empleado.apellido || ''}`.trim(),
                rol: rolNombre,
                negocioId: negocio.id,
                googleLinked: Boolean(usuario.googleId)
            }
        };
    }
}

export const profileService = new ProfileService();
