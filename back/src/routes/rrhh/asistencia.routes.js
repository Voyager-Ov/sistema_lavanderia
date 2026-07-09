import { Router } from "express";
import * as asistenciaController from "../../controllers/rrhh/asistencia.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarSuscripcionActiva } from "../../middlewares/auth/subscription.middleware.js";

const router = Router();

// Todas las rutas de RRHH requieren estar autenticado y tener negocio activo
router.use(verificarToken, verificarSuscripcionActiva);

router.post("/entrada", asistenciaController.ficharEntrada);
router.post("/salida", asistenciaController.ficharSalida);
router.get("/", asistenciaController.getAsistencias);

export default router;
