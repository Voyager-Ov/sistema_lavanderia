import { Router } from "express";
import { obtenerEstadisticasDashboard } from "./controllers/dashboard.controller.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";
import { autorizarRoles } from "../../middlewares/role.middleware.js";

const router = Router();

router.get("/", verificarToken, autorizarRoles("EMPLEADO", "CAJERO", "ADMIN", "SUPERADMIN"), obtenerEstadisticasDashboard);
router.get("/stats", verificarToken, autorizarRoles("EMPLEADO", "CAJERO", "ADMIN", "SUPERADMIN"), obtenerEstadisticasDashboard);

export default router;
