import { AppError } from "../utils/appError.js";
import { emailService } from "../utils/email.util.js";

export const autorizarRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user || !req.user.rol) {
            return next(new AppError("No autorizado para realizar esta acción", 401, "UNAUTHORIZED"));
        }

        const userRol = req.user.rol.toUpperCase().replace("_", "").trim();
        const allowedUpper = rolesPermitidos.map(r => r.toUpperCase().replace("_", "").trim());

        const isAllowed = allowedUpper.includes(userRol) || 
                          (allowedUpper.includes("ADMIN") && userRol.includes("ADMIN")) ||
                          userRol === "SUPERADMIN";

        if (!isAllowed) {
            // Disparar alerta por email de forma asíncrona a octavio.velo2022@gmail.com
            setImmediate(() => {
                emailService.enviarAlertaSeguridad({
                    usuarioEmail: req.user.email,
                    rol: req.user.rol,
                    endpoint: req.originalUrl || req.url,
                    metodo: req.method,
                    ip: req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
                    userAgent: req.headers["user-agent"],
                    negocioId: req.user.negocioId
                }).catch(err => console.error("Error al enviar email de alerta de seguridad:", err?.message));
            });

            return next(new AppError("No posees permisos para realizar esta acción", 403, "FORBIDDEN"));
        }

        next();
    };
};
