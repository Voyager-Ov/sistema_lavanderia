import { AppError } from "../utils/appError.js";

/**
 * Retorna de forma estricta la clave secreta para la firma y verificación de JWT.
 * Si la variable de entorno JWT_SECRET no está definida, lanza un error crítico explícito.
 */
export const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.trim() === "") {
        throw new AppError(
            "ERROR_CONFIGURACION_CRITICO: La variable de entorno JWT_SECRET no está configurada en el servidor.",
            500,
            "CRITICAL_ENV_MISSING"
        );
    }
    return secret;
};

/**
 * Validador global de variables de entorno al iniciar la aplicación.
 */
export const validarVariablesEntorno = () => {
    const requeridas = ["DATABASE_URL", "JWT_SECRET"];
    const faltantes = requeridas.filter(v => !process.env[v] || process.env[v].trim() === "");

    if (faltantes.length > 0) {
        console.error(`🚨 [FALLO CRÍTICO DE CONFIGURACIÓN] Faltan las siguientes variables de entorno obligatorias: ${faltantes.join(", ")}`);
        if (process.env.NODE_ENV !== "test") {
            throw new Error(`Configuración Insegura: Faltan variables de entorno obligatorias: ${faltantes.join(", ")}`);
        }
    }
};
