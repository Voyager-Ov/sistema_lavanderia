import { body } from "express-validator";

export const crearUsuarioValidator = [
    body("nombre").notEmpty().withMessage("El nombre es obligatorio").isString().trim(),
    body("email").isEmail().withMessage("Debe ser un email válido").normalizeEmail(),
    body("password")
        .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres")
        .matches(/^[a-zA-Z0-9]+$/).withMessage("La contraseña debe ser estrictamente alfanumérica"),
    body("rol").isIn(["ADMIN", "EMPLEADO"]).withMessage("Rol inválido"),
    body("sueldoBase").optional().isNumeric().withMessage("El sueldo base debe ser un número"),
    body("horasSemanalesObjetivo").optional().isInt().withMessage("Las horas deben ser un número entero")
];

export const editarUsuarioValidator = [
    body("nombre").optional().isString().trim(),
    body("rol").optional().isIn(["ADMIN", "EMPLEADO"]).withMessage("Rol inválido"),
    body("sueldoBase").optional().isNumeric(),
    body("horasSemanalesObjetivo").optional().isInt()
];

export const usuarioSoftDeleteValidator = [
    body("motivoBaja").notEmpty().withMessage("Debe proveer un motivo para dar de baja al usuario").isString().trim(),
];
