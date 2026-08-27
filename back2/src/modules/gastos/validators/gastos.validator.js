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

export const validateCrearGasto = [
    body("monto")
        .notEmpty()
        .withMessage("El monto del gasto es obligatorio")
        .isFloat({ gt: 0 })
        .withMessage("El monto del gasto debe ser un número mayor a 0"),
    body("metodoPagoId")
        .notEmpty()
        .withMessage("El método de pago es obligatorio")
        .isInt({ min: 1 })
        .withMessage("El método de pago debe ser un ID válido"),
    body("descripcion")
        .optional({ checkFalsy: true })
        .isString()
        .trim(),
    body("categoriaGastoId")
        .optional({ checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage("La categoría de gasto debe ser un ID válido"),
    body("categoria")
        .optional({ checkFalsy: true })
        .isString()
        .trim(),
    handleValidationErrors
];
