import { Router } from "express";
import {
    listarClientes,
    obtenerClientePorId,
    crearCliente,
    actualizarCliente,
    eliminarCliente
} from "./controllers/clientes.controller.js";
import { validateCrearCliente } from "./validators/clientes.validator.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verificarToken, listarClientes);
router.get("/:id", verificarToken, obtenerClientePorId);
router.post("/", verificarToken, validateCrearCliente, crearCliente);
router.put("/:id", verificarToken, actualizarCliente);
router.patch("/:id", verificarToken, actualizarCliente);
router.delete("/:id", verificarToken, eliminarCliente);

export default router;
