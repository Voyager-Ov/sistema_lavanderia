import { body, param, validationResult } from "express-validator";
import { AppError } from "../../../utils/appError.js";

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstErr = errors.array()[0];
        throw new AppError(firstErr.msg, 400, "VALIDATION_ERROR");
    }
    next();
};

export const validateEmpleadoId = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("El ID de empleado debe ser un número entero positivo"),
    handleValidationErrors
];

export const validateCrearEmpleado = [
    body("nombre")
        .notEmpty()
        .withMessage("El nombre del empleado es obligatorio")
        .isString()
        .trim(),
    body("email")
        .notEmpty()
        .withMessage("El correo electrónico es obligatorio")
        .isEmail()
        .withMessage("Debe proporcionar un correo electrónico válido")
        .normalizeEmail(),
    body("password")
        .notEmpty()
        .withMessage("La contraseña es obligatoria para registrar un empleado")
        .isLength({ min: 6 })
        .withMessage("La contraseña debe tener al menos 6 caracteres"),
    body("rol")
        .notEmpty()
        .withMessage("El rol del empleado es obligatorio")
        .isIn(["admin", "empleado", "ADMIN", "EMPLEADO"])
        .withMessage("El rol debe ser 'admin' o 'empleado'"),
    body("sueldoBase")
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage("El sueldo base debe ser un monto numérico válido mayor o igual a 0"),
    body("horasSemanalesObjetivo")
        .optional({ checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage("Las horas semanales objetivo deben ser un número entero mayor a 0"),
    handleValidationErrors
];

export const validateActualizarEmpleado = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("El ID de empleado debe ser un número entero positivo"),
    body("nombre")
        .optional({ checkFalsy: true })
        .isString()
        .trim(),
    body("email")
        .optional({ checkFalsy: true })
        .isEmail()
        .withMessage("Debe proporcionar un correo electrónico válido")
        .normalizeEmail(),
    body("password")
        .optional({ checkFalsy: true })
        .isLength({ min: 6 })
        .withMessage("La contraseña debe tener al menos 6 caracteres"),
    body("rol")
        .optional({ checkFalsy: true })
        .isIn(["admin", "empleado", "ADMIN", "EMPLEADO"])
        .withMessage("El rol debe ser 'admin' o 'empleado'"),
    body("sueldoBase")
        .optional({ checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage("El sueldo base debe ser un monto numérico válido mayor o igual a 0"),
    body("horasSemanalesObjetivo")
        .optional({ checkFalsy: true })
        .isInt({ min: 1 })
        .withMessage("Las horas semanales objetivo deben ser un número entero mayor a 0"),
    handleValidationErrors
];

