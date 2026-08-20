import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import { parseDateRange } from "../../../utils/date.util.js";

export class BaseReportService {
    async _getModels(negocioId) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    _parseDateRange(query) {
        return parseDateRange(query?.fechaInicio || query?.fechaDesde, query?.fechaFin || query?.fechaHasta);
    }
}
