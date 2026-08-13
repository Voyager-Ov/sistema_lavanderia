import { Router } from "express";
import {
    obtenerMetodosPago,
    crearMetodoPago,
    actualizarMetodoPago,
    toggleMetodoPago,
    eliminarMetodoPago,
    registrarPago,
    obtenerSaldosAFavorCliente
} from "./controllers/pagos.controller.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

// Métodos de Pago CRUD (Exclusivo por negocio/tenant)
router.get("/metodos", verificarToken, obtenerMetodosPago);
router.post("/metodos", verificarToken, crearMetodoPago);
router.put("/metodos/:id", verificarToken, actualizarMetodoPago);
router.patch("/metodos/:id", verificarToken, toggleMetodoPago);
router.delete("/metodos/:id", verificarToken, eliminarMetodoPago);

// Cobros y Saldos
router.post("/", verificarToken, registrarPago);
router.get("/saldos-a-favor/:clienteId", verificarToken, obtenerSaldosAFavorCliente);

export default router;
