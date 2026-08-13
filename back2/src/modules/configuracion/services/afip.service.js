import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class AfipService {

    async guardarCertificadosAfip(negocioId, certificadoPath, llavePrivadaPath) {
        if (!negocioId) {
            throw new AppError("ID del negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Negocio } = connectionManager.centralModels;

        let negocio = await Negocio.findByPk(negocioId);
        if (!negocio) {
            negocio = await Negocio.create({ id: negocioId, razonSocial: "Mi Lavandería" });
        }

        const updateFields = {};
        if (certificadoPath) updateFields.certificadoAfipPath = certificadoPath;
        if (llavePrivadaPath) updateFields.llaveAfipPath = llavePrivadaPath;
        updateFields.facturacionHabilitada = true;
        updateFields.afipActivo = true;

        await negocio.update(updateFields);

        return negocio;
    }
}

export const afipService = new AfipService();
