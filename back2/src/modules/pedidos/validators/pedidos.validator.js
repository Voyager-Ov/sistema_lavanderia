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

export const validateCrearPedido = [
    body("detalles")
        .isArray({ min: 1 })
        .withMessage("El pedido debe incluir al menos un ítem o servicio"),
    handleValidationErrors
];

export const validateCambiarEstado = [
    body("estado")
        .notEmpty()
        .isString()
        .withMessage("El nombre del nuevo estado es obligatorio"),
    handleValidationErrors
];
