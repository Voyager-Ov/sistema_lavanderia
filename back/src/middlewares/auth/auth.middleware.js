import jwt from "jsonwebtoken";
import { resolverTenantDB } from "../tenant.middleware.js";

export const verificarToken = (req, res, next) => {
	try {
		// Obtener el token del header (formato: "Bearer <token>")
		let token = req.headers.authorization;

		if (!token) {
			return res.status(401).json({ error: "Acceso denegado. No se proporcionó token." });
		}

		if (token.startsWith("Bearer ")) {
			token = token.slice(7, token.length).trimLeft();
		}

		// Verificar token
		const secret = process.env.JWT_SECRET;
		if (!secret) throw new Error("Missing JWT_SECRET in environment");
		const decoded = jwt.verify(token, secret);
		
		// Inyectar datos del usuario en la request
		req.user = decoded;
		
		// En vez de llamar a next() directamente, delegamos a resolverTenantDB
		// para que cree el contexto asíncrono (AsyncLocalStorage) y cargue la BD del negocio.
		resolverTenantDB(req, res, next);
	} catch (error) {
		return res.status(401).json({ error: "Token inválido o expirado." });
	}
};
