import { body } from "express-validator";

export const crearClienteValidator = [
    body("nombre").notEmpty().withMessage("El nombre es obligatorio").isString().trim(),
    body("telefono").notEmpty().withMessage("El teléfono es obligatorio").isString().trim(),
    body("email").optional({ checkFalsy: true }).isEmail().withMessage("Formato de email inválido")
];

export const actualizarClienteValidator = [
    body("nombre").optional().isString().trim(),
    body("telefono").optional().isString().trim(),
    body("email").optional({ checkFalsy: true }).isEmail().withMessage("Formato de email inválido")
];

export const desactivarClienteValidator = [
    body("motivoBaja").notEmpty().withMessage("Debe proveer un motivo de baja").isString().trim()
];
