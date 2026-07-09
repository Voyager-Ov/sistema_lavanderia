import { Router } from "express";
import * as authController from "../../controllers/auth/auth.controller.js";
import { registerValidator, loginValidator, verifyEmailValidator, forgotPasswordValidator, resetPasswordValidator, changePasswordValidator, resendVerificationValidator } from "../../validators/auth/auth.validator.js";
import { validarCampos } from "../../middlewares/validation.middleware.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { googleLogin, googleLink, googleUnlink } from "../../controllers/auth/google.controller.js";

const router = Router();

// Endpoint para registrar el primer admin y su negocio
router.post("/register", registerValidator, validarCampos, authController.register);

// Endpoint para login
router.post("/login", loginValidator, validarCampos, authController.login);

// Email y Contraseñas
router.post("/verify-email", verifyEmailValidator, validarCampos, authController.verifyEmail);
router.post("/resend-verification", resendVerificationValidator, validarCampos, authController.resendVerification);
router.post("/forgot-password", forgotPasswordValidator, validarCampos, authController.forgotPassword);
router.post("/reset-password", resetPasswordValidator, validarCampos, authController.resetPassword);

// Endpoint para login con Google
router.post("/google", googleLogin);
router.post("/google/link", verificarToken, googleLink);
router.post("/google/unlink", verificarToken, googleUnlink);

// Endpoint para ver mis datos y cambiar mi propia contraseña
router.get("/me", verificarToken, authController.getMe);
router.post("/me/change-password", verificarToken, changePasswordValidator, validarCampos, authController.changePassword);

export default router;
