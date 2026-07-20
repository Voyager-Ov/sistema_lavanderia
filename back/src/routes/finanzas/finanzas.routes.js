import { Router } from "express";
import * as finanzasController from "../../controllers/finanzas/finanzas.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { autorizarRoles } from "../../middlewares/auth/role.middleware.js";
import { verificarSuscripcionActiva } from "../../middlewares/auth/subscription.middleware.js";

const router = Router();
router.use(verificarToken, verificarSuscripcionActiva);

// Solo ADMIN puede ver finanzas
router.use(autorizarRoles(["ADMIN"]));

router.get("/kpis", finanzasController.getKPIs);
router.get("/movimientos", finanzasController.getMovimientos);

export default router;
