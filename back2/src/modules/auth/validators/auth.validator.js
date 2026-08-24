import { body, validationResult } from "express-validator";
import { AppError } from "../../../utils/appError.js";

const handleValidationErrors = (defaultCode = "VALIDATION_ERROR") => {
    return (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const firstErr = errors.array()[0];
            let code = defaultCode;
            if (firstErr.msg.includes("email") || firstErr.msg.includes("correo")) {
                code = "MISSING_EMAIL";
            } else if (firstErr.msg.includes("contraseña") || firstErr.msg.includes("password")) {
                code = "MISSING_PASSWORD";
            } else if (firstErr.msg.includes("token")) {
                code = "MISSING_VERIFICATION_TOKEN";
            }
            throw new AppError(firstErr.msg, 400, code);
        }
        next();
    };
};

export const validateRegister = [
    body("email")
        .trim()
        .notEmpty().withMessage("El email es obligatorio.")
        .isEmail().withMessage("Ingresa un correo electrónico válido."),
    body("password")
        .notEmpty().withMessage("La contraseña es obligatoria.")
        .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres."),
    body("usuarioNombre")
        .optional({ nullable: true })
        .isString().withMessage("El nombre de usuario debe ser texto."),
    body("negocioNombre")
        .optional({ nullable: true })
        .isString().withMessage("El nombre del negocio debe ser texto."),
    handleValidationErrors("VALIDATION_ERROR")
];

export const validateLogin = [
    body("email")
        .trim()
        .notEmpty().withMessage("El email es obligatorio.")
        .isEmail().withMessage("Ingresa un correo electrónico válido."),
    body("password")
        .notEmpty().withMessage("La contraseña es obligatoria."),
    handleValidationErrors("MISSING_CREDENTIALS")
];

export const validateVerifyEmail = [
    body("email")
        .trim()
        .notEmpty().withMessage("El email es obligatorio.")
        .isEmail().withMessage("Ingresa un correo electrónico válido."),
    body("tokenConfirmacion")
        .trim()
        .notEmpty().withMessage("El token de confirmación es obligatorio."),
    handleValidationErrors("MISSING_VERIFICATION_TOKEN")
];

export const validateResendVerification = [
    body("email")
        .trim()
        .notEmpty().withMessage("El email es obligatorio.")
        .isEmail().withMessage("Ingresa un correo electrónico válido."),
    handleValidationErrors("MISSING_EMAIL")
];

export const validateForgotPassword = [
    body("email")
        .trim()
        .notEmpty().withMessage("El email es obligatorio.")
        .isEmail().withMessage("Ingresa un correo electrónico válido."),
    handleValidationErrors("MISSING_EMAIL")
];

export const validateResetPassword = [
    body("email")
        .trim()
        .notEmpty().withMessage("El email es obligatorio.")
        .isEmail().withMessage("Ingresa un correo electrónico válido."),
    body("tokenConfirmacion")
        .trim()
        .notEmpty().withMessage("El token de confirmación es obligatorio."),
    body("newPassword")
        .notEmpty().withMessage("La nueva contraseña es obligatoria.")
        .isLength({ min: 8 }).withMessage("La nueva contraseña debe tener al menos 8 caracteres."),
    handleValidationErrors("VALIDATION_ERROR")
];

export const validateChangePassword = [
    body("oldPassword")
        .notEmpty().withMessage("La contraseña actual es obligatoria."),
    body("newPassword")
        .notEmpty().withMessage("La nueva contraseña es obligatoria.")
        .isLength({ min: 8 }).withMessage("La nueva contraseña debe tener al menos 8 caracteres."),
    handleValidationErrors("VALIDATION_ERROR")
];
