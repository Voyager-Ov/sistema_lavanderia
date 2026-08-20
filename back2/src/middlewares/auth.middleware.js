import jwt from "jsonwebtoken";
import { AppError } from "../utils/appError.js";
import { getJwtSecret } from "../config/env.config.js";

export const verificarToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        let token = null;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            throw new AppError("No se proporcionó un token de autenticación", 401, "UNAUTHORIZED");
        }

        const secret = getJwtSecret();
        const decoded = jwt.verify(token, secret);

        req.user = decoded; // { email, negocioId, empleadoId, rol }
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return next(new AppError("Tu sesión ha caducado. Por favor, vuelve a iniciar sesión.", 401, "TOKEN_EXPIRED"));
        }
        next(error);
    }
};
