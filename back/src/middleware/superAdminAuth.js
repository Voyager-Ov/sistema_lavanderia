import jwt from "jsonwebtoken";

export const superAdminAuth = (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ msg: "No hay token, autorización denegada" });
        }

        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.rol !== "SUPERADMIN_SYS") {
            return res.status(403).json({ msg: "No autorizado. Se requiere rol de SuperAdmin del Sistema." });
        }

        req.superAdmin = decoded;
        next();
    } catch (error) {
        console.error("Error en middleware superAdminAuth:", error.message);
        res.status(401).json({ msg: "Token no válido" });
    }
};
