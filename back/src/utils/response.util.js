export const successResponse = (res, statusCode, message, data = null) => {
    const payload = { ok: true };
    if (message) payload.mensaje = message;
    if (data) payload.data = data;
    
    return res.status(statusCode).json(payload);
};

export const errorResponse = (res, statusCode, message) => {
    return res.status(statusCode).json({
        ok: false,
        error: message
    });
};
