import { Router } from "express";
import { obtenerEstadisticasDashboard } from "./controllers/dashboard.controller.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verificarToken, obtenerEstadisticasDashboard);
router.get("/stats", verificarToken, obtenerEstadisticasDashboard);

export default router;
