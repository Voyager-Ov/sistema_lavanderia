export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (statusCode >= 500) {
        console.error("❌ [SERVER ERROR]:", err);
    } else {
        console.warn(`⚠️ [${statusCode}] ${err.code || "CLIENT_ERROR"}: ${message} (${req.method} ${req.originalUrl || req.url})`);
    }

    res.status(statusCode).json({
        success: false,
        error: err.code || "INTERNAL_SERVER_ERROR",
        message
    });
};
