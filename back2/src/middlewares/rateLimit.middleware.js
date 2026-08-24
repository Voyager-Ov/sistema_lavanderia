import rateLimit from "express-rate-limit";
import { AppError } from "../utils/appError.js";

// Bloqueo de Fuerza Bruta para códigos de verificación (Max 10 intentos)
export const verifyEmailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora de ventana
    max: 10, // Máximo 10 intentos
    handler: (req, res, next) => {
        next(new AppError("Has excedido el número máximo de intentos para verificar el código. Por favor, solicita uno nuevo o intenta más tarde.", 429, "TOO_MANY_ATTEMPTS"));
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Prevención de Spam en reenvío de correos
// Permite hasta 2 intentos inmediatos, luego bloquea por 3 minutos.
export const resendEmailLimiter = rateLimit({
    windowMs: 3 * 60 * 1000, // 3 minutos
    max: 2, // Máximo 2 intentos antes de bloquear la IP por la ventana
    handler: (req, res, next) => {
        next(new AppError("Por favor, espera 3 minutos antes de volver a solicitar un reenvío de correo.", 429, "EMAIL_COOLDOWN"));
    },
    standardHeaders: true,
    legacyHeaders: false,
});
