import { Router } from "express";
import {
    obtenerCajaActual,
    abrirCaja,
    cerrarCaja,
    obtenerHistorialCajas,
    obtenerCajaPorId
} from "./controllers/cajas.controller.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/actual", verificarToken, obtenerCajaActual);
router.get("/estado", verificarToken, obtenerCajaActual);
router.post("/abrir", verificarToken, abrirCaja);
router.post("/:id/cerrar", verificarToken, cerrarCaja);
router.get("/", verificarToken, obtenerHistorialCajas);
router.get("/:id", verificarToken, obtenerCajaPorId);

export default router;
