import { body } from "express-validator";

export const crearProductoValidator = [
    body("categoriaId").notEmpty().withMessage("La categoría es obligatoria").isInt(),
    body("nombre").notEmpty().withMessage("El nombre es obligatorio").isString().trim(),
    body("precioActual").notEmpty().withMessage("El precio es obligatorio").isFloat({ min: 0 }),
    body("costoEstimado").optional().isFloat({ min: 0 })
];

export const actualizarProductoValidator = [
    body("categoriaId").optional().isInt(),
    body("nombre").optional().isString().trim(),
    body("precioActual").optional().isFloat({ min: 0 }),
    body("costoEstimado").optional().isFloat({ min: 0 })
];

export const editarDisponibilidadValidator = [
    body("disponible").isBoolean().withMessage("El campo disponible debe ser booleano")
];
