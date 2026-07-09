import { connectionManager } from "../../models/connectionManager.js";
import { AppError } from "../../utils/errors.js";
import { successResponse } from "../../utils/response.util.js";

// Solo un SuperAdmin debería hacer esto, pero por simplicidad permitimos a los 'admin'
export const getMicroFrontends = async (req, res, next) => {
    try {
        const mfs = await connectionManager.centralModels.MicroFrontend.findAll();
        return successResponse(res, 200, null, mfs);
    } catch (error) {
        next(error);
    }
};

export const createMicroFrontend = async (req, res, next) => {
    try {
        const { nombre, urlOrigen } = req.body;
        const exists = await connectionManager.centralModels.MicroFrontend.findOne({ where: { urlOrigen } });
        if (exists) {
            throw new AppError("Esta URL de Micro-frontend ya está registrada.", 400);
        }

        const newMf = await connectionManager.centralModels.MicroFrontend.create({ nombre, urlOrigen });
        return successResponse(res, 201, "Microfrontend registrado con éxito", newMf);
    } catch (error) {
        next(error);
    }
};

export const toggleMicroFrontend = async (req, res, next) => {
    try {
        const { id } = req.params;
        const mf = await connectionManager.centralModels.MicroFrontend.findByPk(id);
        if (!mf) throw new AppError("MicroFrontend no encontrado", 404);

        mf.activo = !mf.activo;
        await mf.save();
        
        return successResponse(res, 200, "Estado de microfrontend actualizado", mf);
    } catch (error) {
        next(error);
    }
};
