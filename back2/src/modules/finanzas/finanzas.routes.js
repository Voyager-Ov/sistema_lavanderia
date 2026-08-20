import { Router } from "express";
import { getKPIs, getMovimientos } from "./controllers/finanzas.controller.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";
import { autorizarRoles } from "../../middlewares/role.middleware.js";

const router = Router();

router.use(verificarToken, autorizarRoles("ADMIN", "SUPERADMIN"));

router.get("/kpis", getKPIs);
router.get("/movimientos", getMovimientos);

export default router;
