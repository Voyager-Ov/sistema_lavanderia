import { param, query, body, validationResult } from "express-validator";
import { AppError } from "../../../utils/appError.js";

const handleValidationErrors = (errorCode = "VALIDATION_ERROR") => {
    return (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const firstErr = errors.array()[0];
            let code = errorCode;
            if (firstErr.msg.includes("monto") || firstErr.msg.includes("Monto")) {
                code = firstErr.msg.includes("obligatorio") ? "MISSING_AMOUNT" : "INVALID_AMOUNT";
            } else if (firstErr.msg.includes("nombre") || firstErr.msg.includes("Nombre")) {
                code = "MISSING_PAYMENT_METHOD_NAME";
            } else if (firstErr.msg.includes("ID") || firstErr.msg.includes("id")) {
                code = "INVALID_ID";
            }
            throw new AppError(firstErr.msg, 400, code);
        }
        next();
    };
};

export const validateCajaIdParam = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("ID de caja inválido."),
    handleValidationErrors("INVALID_CAJA_ID")
];

export const validateAbrirCaja = [
    body("montoInicial")
        .exists()
        .withMessage("El campo 'montoInicial' es obligatorio.")
        .isFloat({ min: 0 })
        .withMessage("El monto inicial debe ser un número igual o mayor a cero."),
    body("observacionApertura")
        .optional({ nullable: true })
        .isString()
        .withMessage("La observación de apertura debe ser texto."),
    handleValidationErrors("MISSING_INITIAL_AMOUNT")
];

export const validateCerrarCaja = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("ID de caja inválido."),
    body("efectivoReal")
        .exists()
        .withMessage("El campo 'efectivoReal' es obligatorio.")
        .isFloat({ min: 0 })
        .withMessage("El efectivo real debe ser un número igual o mayor a cero."),
    body("observacionCierre")
        .optional({ nullable: true })
        .isString()
        .withMessage("La observación de cierre debe ser texto."),
    handleValidationErrors("MISSING_FINAL_AMOUNT")
];

export const validateCrearMetodoPago = [
    body("nombre")
        .trim()
        .notEmpty()
        .withMessage("El nombre del método de pago es obligatorio.")
        .isString()
        .withMessage("El nombre del método de pago debe ser una cadena de texto."),
    body("icono")
        .optional({ nullable: true })
        .isString()
        .withMessage("El icono debe ser una cadena de texto."),
    handleValidationErrors("MISSING_PAYMENT_METHOD_NAME")
];

export const validateMetodoPagoIdParam = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("ID de método de pago inválido."),
    handleValidationErrors("INVALID_PAYMENT_METHOD_ID")
];
