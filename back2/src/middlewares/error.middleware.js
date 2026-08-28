export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const negocioId = req.user?.negocioId;
    const tenantStr = negocioId ? ` [Tenant: ${negocioId}]` : "";
    const routeStr = `${req.method} ${req.originalUrl || req.url}`;

    if (statusCode >= 500) {
        console.error(`❌ [SERVER ERROR]${tenantStr} ${routeStr}:`, err.stack || err);
    } else {
        console.warn(`⚠️ [CLIENT ERROR ${statusCode}]${tenantStr} ${routeStr} -> ${err.code || "BAD_REQUEST"}: ${message}`);
    }

    res.status(statusCode).json({
        success: false,
        error: err.code || "INTERNAL_SERVER_ERROR",
        message
    });
};
