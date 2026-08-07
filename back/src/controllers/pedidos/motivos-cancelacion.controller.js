import { models } from "../../models/index.js";
import { AppError } from "../../utils/errors.js";

// Obtener todos los motivos activos
export const getMotivos = async (req, res, next) => {
	try {
		const negocioId = req.user.negocioId;
		const motivos = await models.MotivoCancelacion.findAll({
			where: { negocioId, activo: true },
			order: [["id", "ASC"]],
		});

		// Si no hay motivos, devolver los por defecto
		if (motivos.length === 0) {
			const defaults = [
				{ motivo: "Cliente arrepentido" },
				{ motivo: "Error de sistema" },
				{ motivo: "No hay stock" },
				{ motivo: "Otro" }
			];
			return res.status(200).json(defaults);
		}

		res.status(200).json(motivos);
	} catch (error) {
		next(error);
	}
};

export const getTodosMotivosAdmin = async (req, res, next) => {
	try {
		const negocioId = req.user.negocioId;
		const motivos = await models.MotivoCancelacion.findAll({
			where: { negocioId },
			order: [["id", "ASC"]],
		});
		res.status(200).json(motivos);
	} catch (error) {
		next(error);
	}
};

export const createMotivo = async (req, res, next) => {
	try {
		const negocioId = req.user.negocioId;
		const { motivo } = req.body;

		if (!motivo) throw new AppError("El motivo es requerido", 400);

		const nuevoMotivo = await models.MotivoCancelacion.create({
			negocioId,
			motivo,
			activo: true
		});

		res.status(201).json(nuevoMotivo);
	} catch (error) {
		next(error);
	}
};

export const updateMotivo = async (req, res, next) => {
	try {
		const negocioId = req.user.negocioId;
		const { id } = req.params;
		const { motivo, activo } = req.body;

		const m = await models.MotivoCancelacion.findOne({ where: { id, negocioId } });
		if (!m) throw new AppError("Motivo no encontrado", 404);

		if (motivo !== undefined) m.motivo = motivo;
		if (activo !== undefined) m.activo = activo;

		await m.save();
		res.status(200).json(m);
	} catch (error) {
		next(error);
	}
};

export const deleteMotivo = async (req, res, next) => {
	try {
		const negocioId = req.usuario.negocioId;
		const { id } = req.params;

		const m = await models.MotivoCancelacion.findOne({ where: { id, negocioId } });
		if (!m) throw new AppError("Motivo no encontrado", 404);

		await m.destroy();
		res.status(200).json({ message: "Motivo eliminado" });
	} catch (error) {
		next(error);
	}
};
