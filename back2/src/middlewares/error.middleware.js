export const errorHandler = (err, req, res, next) => {
    console.error("❌ Error caught in middleware:", err);
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({
        success: false,
        error: err.code || "INTERNAL_SERVER_ERROR",
        message
    });
};
