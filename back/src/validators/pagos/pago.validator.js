import { body } from "express-validator";

export const registrarPagoValidator = [
    body("pedidoId").notEmpty().withMessage("El ID del pedido es obligatorio").isInt(),
    body("metodoPagoId").optional({ nullable: true }).isInt().withMessage("ID de método de pago inválido"),
    body("monto").optional().isFloat({ min: 0 }).withMessage("El monto debe ser numérico mayor o igual a 0"),
    body("montoRecibido").optional().isFloat({ min: 0 }).withMessage("El monto recibido debe ser numérico mayor o igual a 0"),
    body("aplicarSaldoAFavor").optional().isBoolean().withMessage("aplicarSaldoAFavor debe ser booleano"),
    body("montoSaldoAFavor").optional().isFloat({ min: 0.01 }).withMessage("montoSaldoAFavor debe ser mayor a 0"),
    body("dejarVueltoAFavor").optional().isBoolean().withMessage("dejarVueltoAFavor debe ser booleano"),
    body("facturarAfip").optional().isBoolean().withMessage("facturarAfip debe ser booleano")
];
