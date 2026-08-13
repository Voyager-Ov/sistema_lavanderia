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

export const validateServicio = [
    body("nombre")
        .trim()
        .notEmpty()
        .withMessage("El nombre del servicio es obligatorio"),
    body("precioActual")
        .notEmpty()
        .isFloat({ min: 0 })
        .withMessage("El precio debe ser un número mayor o igual a 0"),
    body("categoriaId")
        .notEmpty()
        .isInt({ min: 1 })
        .withMessage("Debes seleccionar una categoría válida"),
    handleValidationErrors
];

export const validateCategoria = [
    body("nombre")
        .trim()
        .notEmpty()
        .withMessage("El nombre de la categoría es obligatorio"),
    handleValidationErrors
];
