import { body } from "express-validator";

export const registrarPagoValidator = [
    body("pedidoId").notEmpty().withMessage("El ID del pedido es obligatorio").isInt(),
    body("metodoPagoId").notEmpty().withMessage("El ID del método de pago es obligatorio").isInt(),
    body("monto").notEmpty().withMessage("El monto es obligatorio").isFloat({ min: 0 })
];
