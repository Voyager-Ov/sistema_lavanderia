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

export const validateRegister = [
    body("email").isEmail().withMessage("Ingresa un correo electrónico válido"),
    body("password")
        .isLength({ min: 8 })
        .withMessage("La contraseña debe tener al menos 8 caracteres"),
    handleValidationErrors
];

export const validateLogin = [
    body("email").isEmail().withMessage("Ingresa un correo electrónico válido"),
    body("password").notEmpty().withMessage("La contraseña es obligatoria"),
    handleValidationErrors
];

export const validateVerifyEmail = [
    body("email").isEmail().withMessage("Ingresa un correo electrónico válido"),
    handleValidationErrors
];

export const validateResendVerification = [
    body("email").isEmail().withMessage("Ingresa un correo electrónico válido"),
    handleValidationErrors
];

export const validateForgotPassword = [
    body("email").isEmail().withMessage("Ingresa un correo electrónico válido"),
    handleValidationErrors
];

export const validateResetPassword = [
    body("token").notEmpty().withMessage("El token es obligatorio"),
    body("newPassword")
        .optional()
        .isLength({ min: 8 })
        .withMessage("La nueva contraseña debe tener al menos 8 caracteres"),
    body("password")
        .optional()
        .isLength({ min: 8 })
        .withMessage("La nueva contraseña debe tener al menos 8 caracteres"),
    handleValidationErrors
];

export const validateChangePassword = [
    body("oldPassword").notEmpty().withMessage("La contraseña actual es obligatoria"),
    body("newPassword")
        .isLength({ min: 8 })
        .withMessage("La nueva contraseña debe tener al menos 8 caracteres"),
    handleValidationErrors
];
