import { Router } from "express";
import {
    listarClientes,
    obtenerClientePorId,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
    obtenerPedidosImpagosCliente,
    cobrarPedidosCliente,
    obtenerEstadoCuentaCliente,
    obtenerMovimientosCuentaCliente,
    ajustarCreditoCliente
} from "./controllers/clientes.controller.js";
import { validateCrearCliente } from "./validators/clientes.validator.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verificarToken, listarClientes);
router.get("/:id/cuenta-corriente/estado-cuenta", verificarToken, obtenerEstadoCuentaCliente);
router.get("/:id/cuenta-corriente/movimientos", verificarToken, obtenerMovimientosCuentaCliente);
router.post("/:id/cuenta-corriente/cobrar-deuda", verificarToken, cobrarPedidosCliente);
router.post("/:id/cuenta-corriente/ajuste-credito", verificarToken, ajustarCreditoCliente);
router.get("/:id/pedidos-impagos", verificarToken, obtenerPedidosImpagosCliente);
router.post("/:id/cobrar-pedidos", verificarToken, cobrarPedidosCliente);
router.get("/:id", verificarToken, obtenerClientePorId);
router.post("/", verificarToken, validateCrearCliente, crearCliente);
router.put("/:id", verificarToken, actualizarCliente);
router.patch("/:id", verificarToken, actualizarCliente);
router.delete("/:id", verificarToken, eliminarCliente);

export default router;
