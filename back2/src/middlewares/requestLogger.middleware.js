/**
 * Middleware de Logging HTTP Estructurado y Limpio para Producción
 * Muestra el método, ruta, tenantId (si está autenticado), código HTTP y tiempo de respuesta en ms.
 */
export const requestLogger = (req, res, next) => {
    // Omitir logs de archivos estáticos
    if (req.originalUrl.startsWith("/uploads")) {
        return next();
    }

    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const negocioId = req.user?.negocioId;
        const tenantStr = negocioId ? ` [Tenant: ${negocioId}]` : "";

        if (statusCode >= 500) {
            console.error(`❌ [HTTP] ${req.method} ${req.originalUrl}${tenantStr} - Status ${statusCode} (${duration}ms)`);
        } else if (statusCode >= 400) {
            console.warn(`⚠️ [HTTP] ${req.method} ${req.originalUrl}${tenantStr} - Status ${statusCode} (${duration}ms)`);
        } else {
            console.log(`ℹ️ [HTTP] ${req.method} ${req.originalUrl}${tenantStr} - Status ${statusCode} (${duration}ms)`);
        }
    });

    next();
};
