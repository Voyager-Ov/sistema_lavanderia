import { Router } from "express";
import {
    obtenerCajaActual,
    obtenerCajasAbiertas,
    abrirCaja,
    cerrarCaja,
    obtenerHistorialCajas,
    obtenerCajaPorId
} from "./controllers/cajas.controller.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";
import { autorizarRoles } from "../../middlewares/role.middleware.js";

const router = Router();

router.get("/actual", verificarToken, obtenerCajaActual);
router.get("/estado", verificarToken, obtenerCajaActual);
router.get("/abiertas", verificarToken, obtenerCajasAbiertas);
router.post("/abrir", verificarToken, abrirCaja);
router.post("/:id/cerrar", verificarToken, cerrarCaja);

// Historial de Cajas (Admins ven todas, Empleados ven sus propias cajas)
router.get("/", verificarToken, obtenerHistorialCajas);
router.get("/:id", verificarToken, obtenerCajaPorId);

export default router;
