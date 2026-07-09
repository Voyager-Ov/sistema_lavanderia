import { Router } from "express";
import * as clienteController from "../../controllers/clientes/cliente.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarSuscripcionActiva } from "../../middlewares/auth/subscription.middleware.js";
import { validarCampos } from "../../middlewares/validation.middleware.js";
import { crearClienteValidator, actualizarClienteValidator, desactivarClienteValidator } from "../../validators/clientes/cliente.validator.js";

import { verificarRol } from "../../middlewares/role.middleware.js";

const router = Router();

// Todas las rutas de clientes requieren estar logueado y tener suscripción activa
router.use(verificarToken, verificarSuscripcionActiva);

router.get("/", clienteController.getClientes);
router.get("/:id", clienteController.getClienteById);
router.post("/", verificarRol(["admin", "empleado"]), crearClienteValidator, validarCampos, clienteController.crearCliente);
router.put("/:id", verificarRol(["admin", "empleado"]), actualizarClienteValidator, validarCampos, clienteController.actualizarCliente);
router.patch("/:id/estado", verificarRol(["admin", "empleado"]), desactivarClienteValidator, validarCampos, clienteController.desactivarCliente);

export default router;
