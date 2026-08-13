import { AppError } from "../../../utils/appError.js";

export const validateCrearEmpleado = (req, res, next) => {
    const { nombre, email } = req.body;

    if (!nombre || typeof nombre !== "string" || nombre.trim() === "") {
        return next(new AppError("El nombre del empleado es obligatorio.", 400, "VALIDATION_ERROR"));
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
        return next(new AppError("Un correo electrónico válido es obligatorio.", 400, "VALIDATION_ERROR"));
    }

    next();
};
