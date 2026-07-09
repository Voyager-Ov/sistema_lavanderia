import { Router } from "express";
import * as superadminController from "../../controllers/superadmin/superadmin.controller.js";
import * as mfController from "../../controllers/microfrontends/mf.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarRol } from "../../middlewares/role.middleware.js";

const router = Router();

// Todas las rutas aquí requieren autenticación y rol SUPERADMIN
router.use(verificarToken);
router.use(verificarRol(["SUPERADMIN"]));

// --- Gestión de Negocios (SaaS Tenants) ---
router.get("/negocios", superadminController.getNegocios);
router.patch("/negocios/:id/estado", superadminController.updateEstadoSuscripcion);

// --- Gestión de Microfrontends (CORS Origins) ---
router.get("/microfrontends", mfController.getMicroFrontends);
router.post("/microfrontends", mfController.createMicroFrontend);
router.patch("/microfrontends/:id/toggle", mfController.toggleMicroFrontend);

export default router;
