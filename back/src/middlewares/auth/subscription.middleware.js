import { connectionManager } from "../../models/connectionManager.js";

/**
 * Middleware para asegurar que el negocio del usuario autenticado tenga una suscripción activa.
 * Consulta SIEMPRE a la base de datos para evitar vulnerabilidades de manipulación de payloads/body.
 */
export const verificarSuscripcionActiva = async (req, res, next) => {
	try {
		// req.user viene del middleware de JWT (verificarToken)
		if (!req.user || !req.user.negocioId) {
			return res.status(401).json({ error: "Usuario no autenticado o sin negocio asociado." });
		}

		// Consultar directamente a la BD para obtener el estado real y no depender de lo que venga en la query/body
		const negocio = await connectionManager.centralModels.Negocio.findByPk(req.user.negocioId);

		if (!negocio) {
			return res.status(404).json({ error: "El negocio asociado no existe." });
		}

		if (!negocio.activo) {
			return res.status(403).json({ error: "Este negocio ha sido desactivado permanentemente." });
		}

		// Validar si la suscripción está vencida o cancelada
		if (negocio.estadoSuscripcion === "VENCIDA" || negocio.estadoSuscripcion === "CANCELADA") {
			return res.status(402).json({ 
				error: "Pago Requerido. La suscripción de este negocio se encuentra vencida o cancelada." 
			});
		}

		// (Opcional) Si queremos validar la fecha exactamente
		// if (negocio.fechaVencimientoSuscripcion && new Date() > new Date(negocio.fechaVencimientoSuscripcion)) {
		//	 return res.status(402).json({ error: "El periodo de la suscripción ha caducado." });
		// }

		// Si pasa las validaciones, inyectamos el negocio en la request por si el controller lo necesita
		req.negocioInfo = negocio;
		next();
	} catch (error) {
		console.error("Error al verificar la suscripción:", error);
		return res.status(500).json({ error: "Error interno al verificar la suscripción del negocio." });
	}
};
