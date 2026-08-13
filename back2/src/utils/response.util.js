export const successResponse = (res, statusCode = 200, message = "Éxito", data = null) => {
    return res.status(statusCode).json({
        status: "success",
        success: true,
        message,
        ...(data !== null ? { data } : {})
    });
};
