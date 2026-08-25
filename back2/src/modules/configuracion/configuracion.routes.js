import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import {
    getConfiguracion,
    actualizarConfiguracion,
    subirCertificadosAfip,
    subirLogo,
    validarMercadoPagoToken,
    listarMotivosCancelacion,
    crearMotivoCancelacion,
    eliminarMotivoCancelacion
} from "./controllers/configuracion.controller.js";
import { validateBranding, validateMercadoPago } from "./validators/configuracion.validator.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";
import { autorizarRoles } from "../../middlewares/role.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración Multer en Memoria (evita EROFS en Vercel/Serverless)
const uploadCerts = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadLogo = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }
});

const router = Router();

// Obtener Configuración Completa
router.get("/", verificarToken, getConfiguracion);

// Actualización de Configuración (JSON) - Solo Administradores
router.patch("/", verificarToken, autorizarRoles("ADMIN", "SUPERADMIN"), validateBranding, actualizarConfiguracion);
router.put("/", verificarToken, autorizarRoles("ADMIN", "SUPERADMIN"), validateBranding, actualizarConfiguracion);

// Aliases para compatibilidad con llamadas de negocio
router.post("/branding", verificarToken, autorizarRoles("ADMIN", "SUPERADMIN"), validateBranding, actualizarConfiguracion);

// Carga de Certificados AFIP (Multipart)
router.post("/afip/certificados", verificarToken, autorizarRoles("ADMIN", "SUPERADMIN"), uploadCerts.fields([
    { name: "certificado", maxCount: 1 },
    { name: "llavePrivada", maxCount: 1 }
]), subirCertificadosAfip);

router.put("/facturacion-config", verificarToken, autorizarRoles("ADMIN", "SUPERADMIN"), uploadCerts.fields([
    { name: "certificado", maxCount: 1 },
    { name: "llavePrivada", maxCount: 1 }
]), subirCertificadosAfip);

// Carga de Logo (Multipart)
router.post("/logo", verificarToken, autorizarRoles("ADMIN", "SUPERADMIN"), uploadLogo.single("logo"), subirLogo);

// Validación e Integración Mercado Pago
router.post("/mercadopago/validate", verificarToken, autorizarRoles("ADMIN", "SUPERADMIN"), validateMercadoPago, validarMercadoPagoToken);

// Motivos de Cancelación (CRUD)
router.get("/motivos-cancelacion", verificarToken, listarMotivosCancelacion);
router.post("/motivos-cancelacion", verificarToken, autorizarRoles("ADMIN", "SUPERADMIN"), crearMotivoCancelacion);
router.delete("/motivos-cancelacion/:id", verificarToken, autorizarRoles("ADMIN", "SUPERADMIN"), eliminarMotivoCancelacion);

export default router;
