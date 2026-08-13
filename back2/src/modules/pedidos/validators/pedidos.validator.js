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
    body().custom((value, { req }) => {
        const items = req.body.items || req.body.detalles;
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("El pedido debe incluir al menos un ítem o servicio");
        }
        return true;
    }),
    handleValidationErrors
];

export const validateCambiarEstado = [
    body("estado")
        .notEmpty()
        .isString()
        .withMessage("El nombre del nuevo estado es obligatorio"),
    handleValidationErrors
];
