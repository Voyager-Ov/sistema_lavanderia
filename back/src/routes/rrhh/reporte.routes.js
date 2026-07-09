import { Router } from "express";
import * as reporteController from "../../controllers/rrhh/reporte.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { autorizarRoles } from "../../middlewares/auth/role.middleware.js";
import { verificarSuscripcionActiva } from "../../middlewares/auth/subscription.middleware.js";

const router = Router();

// Los reportes de sueldos solo pueden ser vistos por el Administrador
router.use(verificarToken, verificarSuscripcionActiva, autorizarRoles(["admin"]));

// Endpoint: GET /api/rrhh/reportes/sueldos?mes=6&anio=2026
router.get("/sueldos", reporteController.getReporteMensual);

export default router;
