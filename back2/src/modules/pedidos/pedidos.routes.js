import { Router } from "express";
import {
    listarPedidos,
    obtenerEstadisticas,
    obtenerPedidoPorNumero,
    crearPedido,
    cambiarEstado,
    generarFactura,
    obtenerTicketHTML,
    marcarTicketImpreso,
    generarTicketsPrenda,
    obtenerTicketsPrenda
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

// Cambiar estado de pedido (Trazabilidad y Cancelaciones)
router.patch("/:id/estado", verificarToken, validateCambiarEstado, cambiarEstado);
router.put("/:id/estado", verificarToken, validateCambiarEstado, cambiarEstado);

// Facturación AFIP/ARCA
router.post("/:id/factura", verificarToken, generarFactura);

// Imprimir ticket térmico HTML / marcar impreso
router.get("/:id/ticket", verificarToken, obtenerTicketHTML);
router.post("/:id/ticket", verificarToken, marcarTicketImpreso);

// Sub-tickets / etiquetas de prendas
router.post("/:id/tickets", verificarToken, generarTicketsPrenda);
router.get("/:id/tickets", verificarToken, obtenerTicketsPrenda);

export default router;
