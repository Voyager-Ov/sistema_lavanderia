import { Router } from "express";
import {
    register,
    verifyEmail,
    resendVerification,
    login,
    googleLogin,
    forgotPassword,
    resetPassword,
    changePassword,
    getMe
} from "./controllers/auth.controller.js";
import {
    validateRegister,
    validateLogin,
    validateVerifyEmail,
    validateResendVerification,
    validateForgotPassword,
    validateResetPassword,
    validateChangePassword
} from "./validators/auth.validator.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

// Endpoint de Registro (Soporta /register y /register-admin)
router.post("/register", validateRegister, register);
router.post("/register-admin", validateRegister, register);

// Confirmación / Verificación de Correo Electrónico
router.post("/verify-email", validateVerifyEmail, verifyEmail);
router.post("/confirm-email", validateVerifyEmail, verifyEmail);
router.post("/resend-verification", validateResendVerification, resendVerification);

// Inicios de Sesión
router.post("/login", validateLogin, login);
router.post("/google", googleLogin);

// Flujo de Olvido y Restablecimiento de Contraseña
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);

// Endpoints Protegidos (Requieren Token de Sesión Activa)
router.patch("/change-password", verificarToken, validateChangePassword, changePassword);
router.get("/me", verificarToken, getMe);

export default router;
