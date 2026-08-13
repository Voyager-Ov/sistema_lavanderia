import { Router } from "express";
import {
    obtenerMetodosPago,
    crearMetodoPago,
    toggleMetodoPago,
    eliminarMetodoPago,
    registrarPago,
    obtenerSaldosAFavorCliente
} from "./controllers/pagos.controller.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

// Métodos de Pago CRUD
router.get("/metodos", verificarToken, obtenerMetodosPago);
router.post("/metodos", verificarToken, crearMetodoPago);
router.patch("/metodos/:id", verificarToken, toggleMetodoPago);
router.delete("/metodos/:id", verificarToken, eliminarMetodoPago);

// Cobros y Saldos
router.post("/", verificarToken, registrarPago);
router.get("/saldos-a-favor/:clienteId", verificarToken, obtenerSaldosAFavorCliente);

export default router;
