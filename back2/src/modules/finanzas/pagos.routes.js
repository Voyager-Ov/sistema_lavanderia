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
import {
    validateCrearMetodoPago,
    validateMetodoPagoIdParam
} from "./validators/finanzas.validator.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

// Métodos de Pago CRUD (Exclusivo por negocio/tenant)
router.get("/metodos", verificarToken, obtenerMetodosPago);
router.post("/metodos", verificarToken, validateCrearMetodoPago, crearMetodoPago);
router.put("/metodos/:id", verificarToken, validateMetodoPagoIdParam, actualizarMetodoPago);
router.patch("/metodos/:id", verificarToken, validateMetodoPagoIdParam, toggleMetodoPago);
router.delete("/metodos/:id", verificarToken, validateMetodoPagoIdParam, eliminarMetodoPago);

// Cobros y Saldos
router.post("/", verificarToken, registrarPago);
router.get("/saldos-a-favor/:clienteId", verificarToken, obtenerSaldosAFavorCliente);

export default router;
