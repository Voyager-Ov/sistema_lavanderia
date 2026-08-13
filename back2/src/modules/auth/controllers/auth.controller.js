import { authService } from "../services/auth.service.js";
import { successResponse } from "../../../utils/response.util.js";

export const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        return successResponse(res, 201, result.message || "Cuenta registrada exitosamente", result);
    } catch (error) {
        next(error);
    }
};

export const verifyEmail = async (req, res, next) => {
    try {
        const result = await authService.verifyEmail(req.body);
        return successResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
};

export const resendVerification = async (req, res, next) => {
    try {
        const result = await authService.resendVerification(req.body.email);
        return successResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        return successResponse(res, 200, "Autenticación exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const googleLogin = async (req, res, next) => {
    try {
        const result = await authService.loginWithGoogle(req.body);
        return successResponse(res, 200, "Autenticación con Google exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const result = await authService.forgotPassword(req.body.email);
        return successResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const result = await authService.resetPassword(req.body);
        return successResponse(res, 200, result.message);
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const result = await authService.changePassword(
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
        const result = await authService.getProfile(req.user.email);
        return successResponse(res, 200, "Perfil recuperado exitosamente", result);
    } catch (error) {
        next(error);
    }
};
