import jwt from "jsonwebtoken";
import { AppError } from "../utils/appError.js";
import { connectionManager } from "../models/connectionManager.js";

export const superAdminAuth = (req, res, next) => {
    try {
        if (!req.user) {
            throw new AppError("Usuario no autenticado.", 401, "UNAUTHORIZED");
        }

        if (req.user.rol !== "SUPER_ADMIN") {
            throw new AppError("Acceso denegado. Permisos de SuperAdmin requeridos.", 403, "FORBIDDEN");
        }

        req.superAdmin = req.user; // Para retrocompatibilidad si alguna ruta usa req.superAdmin
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
