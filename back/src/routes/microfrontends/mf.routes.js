import { Router } from "express";
import * as mfController from "../../controllers/microfrontends/mf.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarRol } from "../../middlewares/role.middleware.js";

const router = Router();

// Todas las rutas de microfrontends requieren ser Admin
router.use(verificarToken, verificarRol(["admin"]));

router.get("/", mfController.getMicroFrontends);
router.post("/", mfController.createMicroFrontend);
router.patch("/:id/toggle", mfController.toggleMicroFrontend);

export default router;
