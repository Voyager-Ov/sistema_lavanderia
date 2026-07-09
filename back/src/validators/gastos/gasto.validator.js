import { body } from "express-validator";

export const registrarGastoValidator = [
    body("monto").notEmpty().withMessage("El monto es obligatorio").isFloat({ min: 0.01 }),
    body("categoria").notEmpty().withMessage("La categoría es obligatoria").isIn(["Insumos", "Nomina", "Servicios", "Alquiler", "Caja_Diaria", "Otros"]),
    body("descripcion").optional().isString().trim()
];
