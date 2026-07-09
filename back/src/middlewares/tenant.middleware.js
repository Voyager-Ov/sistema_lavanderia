import { connectionManager } from "../models/connectionManager.js";
import { tenantContext } from "../models/index.js";
import { AppError } from "../utils/errors.js";

/**
 * Middleware que intercepta la petición, verifica a qué negocio pertenece el usuario,
 * abre la base de datos correspondiente y envuelve la petición en un AsyncLocalStorage.
 */
export const resolverTenantDB = async (req, res, next) => {
    try {
        if (!req.user || !req.user.negocioId) {
            // Sin autenticación (ej. login). Ejecutamos sin contexto de tenant (usará BD Central).
            return tenantContext.run(null, () => next());
        }

        const negocioId = req.user.negocioId;
        
        // Obtener conexión cacheadas (o crearla si es la primera petición de este negocio)
        const dbContext = await connectionManager.getTenantDb(negocioId);
        
        // Envolver TODO el resto del ciclo de vida de la request en este contexto
        tenantContext.run(dbContext, () => {
            next();
        });
    } catch (error) {
        console.error("❌ Error al resolver la base de datos del Tenant:", error);
        next(new AppError("Error interno al conectar con la base de datos de tu negocio.", 500));
    }
};
