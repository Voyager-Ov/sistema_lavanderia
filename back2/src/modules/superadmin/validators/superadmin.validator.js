import { body, validationResult } from "express-validator";
import { AppError } from "../../../utils/appError.js";

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstErr = errors.array()[0];
        throw new AppError(firstErr.msg, 400, "VALIDATION_ERROR");
    }
    next();
};

export const validateLogin = [
    body("email")
        .notEmpty().withMessage("El email es obligatorio")
        .isEmail().withMessage("Debe proporcionar un email válido"),
    body("password")
        .notEmpty().withMessage("La contraseña es obligatoria"),
    handleValidationErrors
];
