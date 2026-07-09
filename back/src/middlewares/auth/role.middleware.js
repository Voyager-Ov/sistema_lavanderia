export const autorizarRoles = (rolesPermitidos) => {
	return (req, res, next) => {
		if (!req.user || !req.user.rol) {
			return res.status(401).json({ error: "Usuario no autenticado." });
		}

		const rolesUpper = rolesPermitidos.map(r => r.toUpperCase());
		if (!rolesUpper.includes(req.user.rol.toUpperCase())) {
			return res.status(403).json({ error: "Acceso denegado. No tienes permisos para realizar esta acción." });
		}

		next();
	};
};
