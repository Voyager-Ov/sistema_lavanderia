import { errorResponse } from "../utils/response.util.js";
import { AppError } from "../utils/errors.js";
/**
 * Middleware global de manejo de errores.
 * Atrapa cualquier error pasado mediante next(err) y lo estandariza.
 */
export const errorHandler = (err, req, res, next) => {
    console.error("\n--- ERROR HANDLER CAUGHT ERROR ---");
    console.error(err);
    if (err.stack) console.error(err.stack);
    console.error("----------------------------------\n");
    // Si el error es una instancia de AppError, usamos su status explícito
    if (err instanceof AppError) {
        return errorResponse(res, err.status, err.message);
    }

    // Manejo de errores de Sequelize
    if (err.name === "SequelizeUniqueConstraintError") {
        return errorResponse(res, 400, "El registro ya existe (violación de unicidad)");
    }
    if (err.name === "SequelizeValidationError") {
        const mensajes = err.errors ? err.errors.map(e => e.message).join(", ") : err.message;
        return errorResponse(res, 400, `Error de validación: ${mensajes}`);
    }

    // JSON Web Token Errors
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        return errorResponse(res, 401, "Token inválido o expirado");
    }

    // Fallback genérico para errores no controlados
    console.error("❌ Error no capturado:", err);
    
    // Ocultar detalles del error en producción por seguridad
    const isProd = process.env.NODE_ENV === "production";
    
    return res.status(500).json({ 
        error: "Error interno del servidor",
        detalle: isProd ? undefined : err.message
    });
};
