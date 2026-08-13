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

export const validateCrearCliente = [
    body("nombre")
        .notEmpty()
        .isString()
        .withMessage("El nombre del cliente es obligatorio"),
    handleValidationErrors
];
