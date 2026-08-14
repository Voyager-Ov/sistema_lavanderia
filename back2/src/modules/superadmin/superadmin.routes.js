import { Router } from "express";
import {
    getDashboard,
    getHealthCheck,
    getNegocios,
    updateStatus,
    updateEstadoSuscripcion
} from "./controllers/superadmin.controller.js";
import { superAdminAuth } from "../../middlewares/superadmin.middleware.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

// Protected routes (SuperAdmin only)
router.use(verificarToken, superAdminAuth);

router.get("/dashboard", getDashboard);
router.get("/health-check", getHealthCheck);
router.get("/negocios", getNegocios);
router.put("/negocios/:id/status", updateStatus);
router.patch("/negocios/:id/estado", updateEstadoSuscripcion);

export default router;
