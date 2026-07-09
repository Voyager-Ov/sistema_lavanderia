import { body } from "express-validator";

export const registerValidator = [
    body("negocioNombre").notEmpty().withMessage("El nombre del negocio es obligatorio").isString().trim(),
    body("usuarioNombre").notEmpty().withMessage("El nombre de usuario es obligatorio").isString().trim(),
    body("email").isEmail().withMessage("Debe ser un email válido").normalizeEmail(),
    body("password")
        .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres")
        .matches(/^[a-zA-Z0-9]+$/).withMessage("La contraseña debe ser estrictamente alfanumérica (solo letras y números)")
];

export const loginValidator = [
    body("email").isEmail().withMessage("Debe ser un email válido").normalizeEmail(),
    body("password").notEmpty().withMessage("La contraseña es obligatoria")
];

export const verifyEmailValidator = [
    body("email").isEmail().withMessage("Debe ser un email válido").normalizeEmail(),
    body("code").isLength({ min: 6, max: 6 }).withMessage("El código debe tener 6 caracteres")
];

export const forgotPasswordValidator = [
    body("email").isEmail().withMessage("Debe ser un email válido").normalizeEmail()
];

export const resendVerificationValidator = [
    body("email").isEmail().withMessage("Debe ser un email válido").normalizeEmail()
];

export const resetPasswordValidator = [
    body("token").notEmpty().withMessage("El token es obligatorio"),
    body("newPassword")
        .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres")
        .matches(/^[a-zA-Z0-9]+$/).withMessage("La contraseña debe ser estrictamente alfanumérica (solo letras y números)")
];

export const changePasswordValidator = [
    body("oldPassword").notEmpty().withMessage("La contraseña actual es obligatoria"),
    body("newPassword")
        .isLength({ min: 8 }).withMessage("La contraseña nueva debe tener al menos 8 caracteres")
        .matches(/^[a-zA-Z0-9]+$/).withMessage("La contraseña nueva debe ser estrictamente alfanumérica")
];
