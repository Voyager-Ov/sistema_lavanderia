import { Router } from "express";
import * as pedidoController from "../../controllers/pedidos/pedido.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarSuscripcionActiva } from "../../middlewares/auth/subscription.middleware.js";
import { validarCampos } from "../../middlewares/validation.middleware.js";
import { crearPedidoValidator, actualizarEstadoValidator } from "../../validators/pedidos/pedido.validator.js";

const router = Router();
router.use(verificarToken, verificarSuscripcionActiva);

router.post("/", crearPedidoValidator, validarCampos, pedidoController.crearPedido);
router.get("/", pedidoController.getPedidos);
router.get("/:id", pedidoController.getPedidoById);
router.patch("/:id/estado", actualizarEstadoValidator, validarCampos, pedidoController.cambiarEstadoPedido);

export default router;
