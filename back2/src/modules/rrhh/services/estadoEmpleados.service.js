import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class EstadoEmpleadosService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    async cambiarEstadoEmpleado(negocioId, id, nuevoEstado) {
        if (!negocioId) throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        const { Empleado } = await this._getModels(negocioId);
        const centralModels = connectionManager.centralModels;

        const empleado = await Empleado.findByPk(id);
        if (!empleado) throw new AppError("Empleado no encontrado.", 404, "EMPLOYEE_NOT_FOUND");

        const targetActivo = nuevoEstado !== undefined ? !!nuevoEstado : !empleado.activo;

        await empleado.update({ activo: targetActivo });

        // Si tenía credencial central, actualizar estado de usuario
        if (empleado.usuarioIdCentral) {
            const usr = await centralModels.Usuario.findByPk(empleado.usuarioIdCentral);
            if (usr) {
                await usr.update({ activo: targetActivo });
            }
        }

        return empleado;
    }
}

export const estadoEmpleadosService = new EstadoEmpleadosService();
