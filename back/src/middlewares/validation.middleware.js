import { validationResult } from "express-validator";

export const validarCampos = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const errorArr = errors.array();
		return res.status(400).json({
			error: "Errores de validación",
			message: errorArr[0].msg,
			detalles: errorArr.map(err => ({ campo: err.path, mensaje: err.msg }))
		});
	}
	next();
};
