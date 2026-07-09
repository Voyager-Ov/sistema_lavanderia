import { Router } from "express";
import * as dashboardController from "../../controllers/dashboard/dashboard.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";

const router = Router();

router.use(verificarToken);

router.get("/stats", dashboardController.getDashboardOverview);
router.get("/caja/:cajaId", dashboardController.getCierreCajaOverview);

export default router;
