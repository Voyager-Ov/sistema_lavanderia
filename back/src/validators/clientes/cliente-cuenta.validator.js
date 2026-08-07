import { body, param, query } from "express-validator";

export const cobrarDeudaValidator = [
    param("id").isInt({ min: 1 }).withMessage("ID de cliente inválido."),
    body("pedidosIds").optional().isArray({ min: 1 }).withMessage("pedidosIds debe ser un array con al menos un ID de pedido."),
    body("pedidosIds.*").optional().isInt({ min: 1 }).withMessage("Cada ID de pedido debe ser un entero positivo."),
    body("pedidos").optional().isArray({ min: 1 }).withMessage("pedidos debe ser un array con al menos un pedido."),
    body("metodoPagoId").optional({ nullable: true }).isInt({ min: 1 }).withMessage("ID de método de pago inválido."),
    body("montoRecibido").optional().isFloat({ min: 0 }).withMessage("El monto recibido debe ser mayor o igual a 0."),
    body("aplicarSaldoAFavor").optional().isBoolean().withMessage("aplicarSaldoAFavor debe ser booleano."),
    body("dejarVueltoAFavor").optional().isBoolean().withMessage("dejarVueltoAFavor debe ser booleano.")
];

export const ajusteManualCreditoValidator = [
    body("monto").isFloat({ min: 0.01 }).withMessage("El monto del crédito debe ser mayor a 0."),
    body("motivo").isString().trim().isLength({ min: 5 }).withMessage("Debe especificar un motivo válido de al menos 5 caracteres.")
];

export const movimientosFiltroValidator = [
    param("id").isInt({ min: 1 }).withMessage("ID de cliente inválido."),
    query("page").optional().isInt({ min: 1 }).withMessage("Página debe ser un entero positivo."),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Límite debe estar entre 1 y 100."),
    query("desde").optional().isISO8601().withMessage("Fecha desde inválida."),
    query("hasta").optional().isISO8601().withMessage("Fecha hasta inválida.")
];
