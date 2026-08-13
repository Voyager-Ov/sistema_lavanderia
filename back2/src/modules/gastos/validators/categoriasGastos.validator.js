import { AppError } from "../../../utils/appError.js";

export const validateCrearCategoriaGasto = (req, res, next) => {
    const { nombre } = req.body;

    if (!nombre || typeof nombre !== "string" || nombre.trim() === "") {
        return next(new AppError("El nombre de la categoría es obligatorio.", 400, "VALIDATION_ERROR"));
    }

    next();
};
