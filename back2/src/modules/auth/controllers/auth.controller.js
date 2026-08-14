import { registerService } from "../services/register.service.js";
import { verifyEmailService } from "../services/verifyEmail.service.js";
import { loginService } from "../services/login.service.js";
import { passwordService } from "../services/password.service.js";
import { profileService } from "../services/profile.service.js";
import { successResponse } from "../../../utils/response.util.js";

/**
 * AuthController
 * Controlador encargado de recibir las peticiones de autenticación y orquestar
 * la ejecución a través de servicios modularizados por caso de uso.
 */
export const register = async (req, res, next) => {
    try {
        const result = await registerService.register(req.body);
        return successResponse(res, 201, result.message || "Cuenta registrada exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const verifyEmail = async (req, res, next) => {
    try {
        const result = await verifyEmailService.verifyEmail(req.body);
        return successResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
};

export const resendVerification = async (req, res, next) => {
    try {
        const result = await verifyEmailService.resendVerification(req.body.email);
        return successResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const result = await loginService.login(req.body);
        return successResponse(res, 200, "Autenticación exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const googleLogin = async (req, res, next) => {
    try {
        const result = await loginService.loginWithGoogle(req.body);
        return successResponse(res, 200, "Autenticación con Google exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const result = await passwordService.forgotPassword(req.body.email);
        return successResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const result = await passwordService.resetPassword(req.body);
        return successResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const result = await passwordService.changePassword(
            req.user.email,
            req.body.oldPassword,
            req.body.newPassword
        );
        return successResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req, res, next) => {
    try {
        const result = await profileService.getProfile(req.user.email);
        return successResponse(res, 200, "Perfil recuperado exitosamente", result);
    } catch (error) {
        next(error);
    }
};
