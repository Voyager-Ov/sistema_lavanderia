import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class AnulacionGastosService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    async anularGasto(negocioId, id) {
        if (!negocioId) throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        const { Gasto, MovimientoCaja } = await this._getModels(negocioId);

        const gasto = await Gasto.findByPk(id);
        if (!gasto) throw new AppError("Gasto no encontrado.", 404, "EXPENSE_NOT_FOUND");

        if (gasto.estadoGasto === "Anulado") {
            throw new AppError("El gasto ya se encuentra anulado.", 400, "EXPENSE_ALREADY_ANNULLED");
        }

        // Si tenía movimiento de caja asociado, revertirlo
        if (gasto.movimientoCajaId) {
            const mov = await MovimientoCaja.findByPk(gasto.movimientoCajaId);
            if (mov) {
                await mov.update({
                    observacion: `[ANULADO] ${mov.observacion}`
                });
            }
        }

        await gasto.update({ estadoGasto: "Anulado" });

        return {
            id: gasto.id,
            estadoGasto: "Anulado",
            message: "Gasto anulado correctamente."
        };
    }
}

export const anulacionGastosService = new AnulacionGastosService();
