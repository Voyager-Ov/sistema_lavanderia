import * as authService from "../../services/auth.service.js";
import { successResponse } from "../../utils/response.util.js";
import { normalizeEmail } from "../../utils/email.util.js";

export const register = async (req, res, next) => {
    try {
        if (req.body.email) req.body.email = normalizeEmail(req.body.email);
        const result = await authService.registerAdmin(req.body);
        return successResponse(res, 201, "Registro exitoso", result);
    } catch (error) {
        if (error.message === "EMAIL_IN_USE") {
            return res.status(400).json({ error: "El email ya está en uso.", message: "El email ya está en uso." });
        }
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;
        const result = await authService.login(email, password);
        return successResponse(res, 200, "Login exitoso", result);
    } catch (error) {
        if (error.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({ error: "Credenciales inválidas.", message: "Credenciales inválidas." });
        }
        if (error.message === "USER_DISABLED") {
            return res.status(403).json({ error: "Cuenta de usuario desactivada.", message: "Cuenta de usuario desactivada." });
        }
        next(error);
    }
};

export const getMe = async (req, res, next) => {
    try {
        // req.user ya está disponible por el middleware verificarToken
        return successResponse(res, 200, null, req.user);
    } catch (error) {
        next(error);
    }
};

export const verifyEmail = async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { code } = req.body;
        const result = await authService.verificarEmail(email, code);
        return successResponse(res, 200, result.mensaje);
    } catch (error) {
        next(error);
    }
};

export const resendVerification = async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const result = await authService.reenviarCodigoVerificacion(email);
        return successResponse(res, 200, result.mensaje);
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const result = await authService.solicitarRecuperacionPassword(email);
        return successResponse(res, 200, result.mensaje);
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        const result = await authService.resetPassword(token, newPassword);
        return successResponse(res, 200, result.mensaje);
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
        return successResponse(res, 200, result.mensaje);
    } catch (error) {
        next(error);
    }
};
