import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class AnulacionGastosService {

    async _getModels(negocioId) {
        const tenantContext = await connectionManager.getTenantDb(negocioId);
        return { sequelize: tenantContext.sequelize, models: tenantContext.models };
    }

    async anularGasto(negocioId, id) {
        if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        const { sequelize, models } = await this._getModels(negocioId);
        const { Gasto, MovimientoCaja } = models;

        const gasto = await Gasto.findOne({ where: { id, negocioId } });
        if (!gasto) throw new AppError("Gasto no encontrado.", 404, "EXPENSE_NOT_FOUND");

        if (gasto.estadoGasto === "Anulado") {
            throw new AppError("El gasto ya se encuentra anulado.", 400, "EXPENSE_ALREADY_ANNULLED");
        }

        const transaction = await sequelize.transaction();
        try {
            if (gasto.movimientoCajaId) {
                const mov = await MovimientoCaja.findByPk(gasto.movimientoCajaId, { transaction });
                if (mov) {
                    await mov.update({
                        observacion: `[ANULADO] ${mov.observacion}`
                    }, { transaction });
                }
            }

            await gasto.update({ estadoGasto: "Anulado" }, { transaction });

            await transaction.commit();

            return {
                id: gasto.id,
                estadoGasto: "Anulado",
                message: "Gasto anulado correctamente."
            };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

export const anulacionGastosService = new AnulacionGastosService();
