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
        .withMessage("El precio actual del servicio es obligatorio")
        .isFloat({ min: 0 })
        .withMessage("El precio actual debe ser un número mayor o igual a 0"),
    body("costoEstimado")
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage("El costo estimado debe ser un número mayor o igual a 0"),
    body("tiempoEstimadoMinutos")
        .optional({ checkFalsy: true })
        .isInt({ min: 0 })
        .withMessage("El tiempo estimado debe ser un número entero mayor o igual a 0"),
    body("categoriaId")
        .optional({ checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage("Debes seleccionar una categoría válida"),
    handleValidationErrors
];

export const validateServicioUpdate = [
    body("nombre")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("El nombre del servicio no puede estar vacío"),
    body("precioActual")
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage("El precio actual debe ser un número mayor o igual a 0"),
    body("costoEstimado")
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage("El costo estimado debe ser un número mayor o igual a 0"),
    body("tiempoEstimadoMinutos")
        .optional({ checkFalsy: true })
        .isInt({ min: 0 })
        .withMessage("El tiempo estimado debe ser un número entero mayor o igual a 0"),
    body("categoriaId")
        .optional({ checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage("Debes seleccionar una categoría válida"),
    handleValidationErrors
];

export const validateBulkPrecios = [
    body("servicios")
        .isArray({ min: 1 })
        .withMessage("Se requiere una lista de 'servicios' no vacía para actualizar precios"),
    body("servicios.*.id")
        .isInt({ min: 1 })
        .withMessage("Cada servicio a actualizar debe incluir un 'id' numérico válido"),
    body("servicios.*.precioActual")
        .isFloat({ min: 0 })
        .withMessage("Cada servicio debe incluir un 'precioActual' numérico mayor o igual a 0"),
    handleValidationErrors
];

export const validateBulkDisponibilidad = [
    body("ids")
        .isArray({ min: 1 })
        .withMessage("Se requiere una lista de 'ids' no vacía"),
    body("ids.*")
        .isInt({ min: 1 })
        .withMessage("Cada id debe ser un número entero válido"),
    body("disponible")
        .isBoolean()
        .withMessage("El campo 'disponible' debe ser un valor booleano (true/false)"),
    handleValidationErrors
];

export const validateCategoria = [
    body("nombre")
        .trim()
        .notEmpty()
        .withMessage("El nombre de la categoría es obligatorio"),
    handleValidationErrors
];
