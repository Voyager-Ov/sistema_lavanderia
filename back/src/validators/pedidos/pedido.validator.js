import { body } from "express-validator";

export const crearPedidoValidator = [
    body("clienteId").notEmpty().withMessage("El cliente es obligatorio").isInt(),
    body("items").isArray({ min: 1 }).withMessage("Debe incluir al menos un ítem en el pedido"),
    body("items.*.productoId").isInt().withMessage("El ID del producto debe ser un entero"),
    body("items.*.cantidad").isInt({ min: 1, max: 10000 }).withMessage("La cantidad debe ser entre 1 y 10000"),
    body("fechaEntregaEstimada").optional({ checkFalsy: true }).isISO8601().withMessage("La fecha estimada de entrega debe tener un formato de fecha válido")
];

export const actualizarEstadoValidator = [
    body("estado").notEmpty().withMessage("El estado es obligatorio").isIn(["PENDIENTE", "EN_PROCESO", "LISTO_PARA_RETIRAR", "ENTREGADO", "CANCELADO"]),
    body("comentario").optional().isString().trim()
];
