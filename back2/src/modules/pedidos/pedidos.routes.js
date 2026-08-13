import { Router } from "express";
import {
    listarPedidos,
    obtenerEstadisticas,
    obtenerPedidoPorNumero,
    crearPedido,
    cambiarEstado,
    marcarTicketImpreso
} from "./controllers/pedidos.controller.js";
import { validateCrearPedido, validateCambiarEstado } from "./validators/pedidos.validator.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

// Estadísticas de pedidos
router.get("/stats", verificarToken, obtenerEstadisticas);

// Listar pedidos
router.get("/", verificarToken, listarPedidos);

// Obtener por ID / número de pedido
router.get("/:id", verificarToken, obtenerPedidoPorNumero);

// Crear pedido
router.post("/", verificarToken, validateCrearPedido, crearPedido);

// Cambiar estado de pedido (Trazabilidad)
router.patch("/:id/estado", verificarToken, validateCambiarEstado, cambiarEstado);
router.put("/:id/estado", verificarToken, validateCambiarEstado, cambiarEstado);

// Marcar ticket impreso
router.post("/:id/ticket", verificarToken, marcarTicketImpreso);

export default router;
