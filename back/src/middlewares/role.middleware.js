import { errorResponse } from "../utils/response.util.js";

/**
 * Middleware para proteger rutas basadas en el rol del usuario logueado.
 * @param {string[]} rolesPermitidos - Arreglo de roles que pueden acceder a la ruta (ej: ['admin', 'empleado'])
 */
export const verificarRol = (rolesPermitidos) => {
    return (req, res, next) => {
        try {
            const { rol } = req.user;
            
            const rolesUpper = rolesPermitidos.map(r => r.toUpperCase());
            if (!rolesUpper.includes(rol.toUpperCase())) {
                return errorResponse(res, 403, `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`);
            }
            
            next();
        } catch (error) {
            next(error);
        }
    };
};
