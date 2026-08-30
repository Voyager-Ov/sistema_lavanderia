import { registerService } from "./register.service.js";
import { verifyEmailService } from "./verifyEmail.service.js";
import { loginService } from "./login.service.js";
import { passwordService } from "./password.service.js";
import { profileService } from "./profile.service.js";

/**
 * AuthService (Fachada / Facade Pattern)
 * Agrupa los servicios modularizados de autenticación para mantener compatibilidad
 * limpia y delegar cada responsabilidad a su servicio especializado.
 */
class AuthService {
    async register(data) {
        return registerService.register(data);
    }

    async sustanciarAprobacionNegocio(solicitudId, superadminEmail) {
        return registerService.sustanciarAprobacionNegocio(solicitudId, superadminEmail);
    }

    async verifyEmail(data) {
        return verifyEmailService.verifyEmail(data);
    }

    async resendVerification(email) {
        return verifyEmailService.resendVerification(email);
    }

    async login(data) {
        return loginService.login(data);
    }

    async loginWithGoogle(data) {
        return loginService.loginWithGoogle(data);
    }

    async forgotPassword(email) {
        return passwordService.forgotPassword(email);
    }

    async resetPassword(data) {
        return passwordService.resetPassword(data);
    }

    async changePassword(email, oldPassword, newPassword) {
        return passwordService.changePassword(email, oldPassword, newPassword);
    }

    async getProfile(email) {
        return profileService.getProfile(email);
    }
}

export const authService = new AuthService();
export { registerService, verifyEmailService, loginService, passwordService, profileService };
