import { body } from "express-validator";

export const registrarGastoValidator = [
    body("monto").notEmpty().withMessage("El monto es obligatorio").isFloat({ min: 0.01 }),
    body("categoria").notEmpty().withMessage("La categoría es obligatoria").isString().trim(),
    body("descripcion").optional().isString().trim()
];
