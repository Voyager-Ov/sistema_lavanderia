import { AppError } from "../../../utils/appError.js";

export const validateCrearGasto = (req, res, next) => {
    const { monto, montoTotal } = req.body;
    const valMonto = parseFloat(monto || montoTotal);

    if (isNaN(valMonto) || valMonto <= 0) {
        return next(new AppError("El monto del gasto es obligatorio y debe ser un número positivo.", 400, "VALIDATION_ERROR"));
    }

    next();
};
