import { Router } from "express";
import * as configuracionController from "../../controllers/configuracion/configuracion.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarRol } from "../../middlewares/role.middleware.js";

import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(verificarToken);

// Solo el ADMIN (dueño de la lavandería) o SUPERADMIN pueden ver y editar la configuración
router.get("/", verificarRol(["ADMIN", "SUPERADMIN"]), configuracionController.getConfiguracion);
router.patch("/", verificarRol(["ADMIN", "SUPERADMIN"]), configuracionController.updateConfiguracion);

// Subida de Certificados AFIP
router.post(
    "/afip/certificados",
    verificarRol(["ADMIN", "SUPERADMIN"]),
    upload.fields([{ name: "certificado", maxCount: 1 }, { name: "llavePrivada", maxCount: 1 }]),
    configuracionController.uploadCertificadosAfip
);

// --- Rutas de WhatsApp ---
// Automático eliminado, solo se mantiene en UI manual.

export default router;
