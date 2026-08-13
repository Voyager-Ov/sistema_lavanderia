import { AppError } from "../utils/appError.js";

export const autorizarRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user || !req.user.rol) {
            return next(new AppError("No autorizado para realizar esta acción", 401, "UNAUTHORIZED"));
        }

        const userRol = req.user.rol.toUpperCase();
        const allowedUpper = rolesPermitidos.map(r => r.toUpperCase());

        const isAllowed = allowedUpper.includes(userRol) || 
                          allowedUpper.includes("ADMIN") && userRol.includes("ADMIN") ||
                          userRol === "SUPERADMIN";

        if (!isAllowed) {
            return next(new AppError("No posees permisos para realizar esta acción", 403, "FORBIDDEN"));
        }

        next();
    };
};
