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

export const validateBranding = [
    body("colorPrincipal")
        .optional()
        .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .withMessage("El color principal debe ser un código hexadecimal válido (ej. #2563eb)"),
    body("colorSecundario")
        .optional()
        .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .withMessage("El color secundario debe ser un código hexadecimal válido (ej. #1e40af)"),
    handleValidationErrors
];

export const validateMercadoPago = [
    body("tokenMercadoPago")
        .optional()
        .isString()
        .withMessage("El token de Mercado Pago debe ser una cadena de caracteres"),
    handleValidationErrors
];
