import { AppError } from "../utils/appError.js";
import { connectionManager } from "../models/connectionManager.js";
import { emailService } from "../utils/email.util.js";

export const superAdminAuth = (req, res, next) => {
    try {
        if (!req.user) {
            throw new AppError("Usuario no autenticado.", 401, "UNAUTHORIZED");
        }

        if (req.user.rol !== "SUPER_ADMIN") {
            // Disparar correo de alerta de seguridad en segundo plano
            emailService.enviarAlertaSeguridad({
                usuarioEmail: req.user?.email || "Desconocido",
                rol: req.user?.rol || "Sin Rol",
                endpoint: req.originalUrl || req.url,
                metodo: req.method,
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.headers["user-agent"],
                negocioId: req.user?.negocioId || "Global"
            }).catch(err => console.error("⚠️ Error al enviar alerta de seguridad SuperAdmin:", err.message));

            throw new AppError("Acceso denegado. Permisos de SuperAdmin requeridos.", 403, "FORBIDDEN");
        }

        req.superAdmin = req.user;
        next();
    } catch (error) {
        next(error);
    }
};

export const verificarSuscripcionActiva = async (req, res, next) => {
    try {
        const negocioId = req.user?.negocioId;
        if (!negocioId) {
            throw new AppError("Negocio no identificado en la sesión.", 400, "TENANT_REQUIRED");
        }

        const Negocio = connectionManager.centralModels.Negocio;
        const negocio = await Negocio.findByPk(negocioId);

        if (!negocio || negocio.activo === false || negocio.estadoSuscripcion === "SUSPENDIDA") {
            throw new AppError(
                "El servicio de su lavandería se encuentra suspendido. Regularice su suscripción para continuar operando.",
                403,
                "SUBSCRIPTION_SUSPENDED"
            );
        }
        next();
    } catch (error) {
        next(error);
    }
};
