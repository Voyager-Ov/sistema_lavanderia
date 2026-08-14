import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class ProfileService {
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
            include: [{ model: Rol, through: { attributes: [] } }]
        });

        if (!usuario) {
            throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
        }

        const { empleado, negocio } = await this._getEmpleadoYNegocioStrict(usuario);
        const rolNombre = usuario.Roles && usuario.Roles.length > 0 ? usuario.Roles[0].nombre : "ADMIN";

        return {
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
}

export const profileService = new ProfileService();
