import { body } from "express-validator";

export const abrirCajaValidator = [
    body("montoInicial").optional().isFloat({ min: 0 }).withMessage("El monto inicial debe ser 0 o mayor")
];

export const cerrarCajaValidator = [
    body("efectivoReal").notEmpty().withMessage("Debe declarar cuánto efectivo real hay en caja").isFloat({ min: 0 })
];
