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
import {
    validateIdParam,
    validateListarClientesQuery,
    validateCrearCliente,
    validateActualizarCliente,
    validateAjusteCredito
} from "./validators/clientes.validator.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verificarToken, validateListarClientesQuery, listarClientes);
router.get("/:id/cuenta-corriente/estado-cuenta", verificarToken, validateIdParam, obtenerEstadoCuentaCliente);
router.get("/:id/cuenta-corriente/movimientos", verificarToken, validateIdParam, obtenerMovimientosCuentaCliente);
router.post("/:id/cuenta-corriente/cobrar-deuda", verificarToken, validateIdParam, cobrarPedidosCliente);
router.post("/:id/cuenta-corriente/ajuste-credito", verificarToken, validateAjusteCredito, ajustarCreditoCliente);
router.get("/:id/pedidos-impagos", verificarToken, validateIdParam, obtenerPedidosImpagosCliente);
router.post("/:id/cobrar-pedidos", verificarToken, validateIdParam, cobrarPedidosCliente);
router.get("/:id", verificarToken, validateIdParam, obtenerClientePorId);
router.post("/", verificarToken, validateCrearCliente, crearCliente);
router.put("/:id", verificarToken, validateActualizarCliente, actualizarCliente);
router.patch("/:id", verificarToken, validateActualizarCliente, actualizarCliente);
router.delete("/:id", verificarToken, validateIdParam, eliminarCliente);

export default router;
