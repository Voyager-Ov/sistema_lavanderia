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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorios de carga
const certsDir = process.env.VERCEL ? "/tmp/uploads/certs" : path.join(__dirname, "../../../public/uploads/certs");
const logosDir = process.env.VERCEL ? "/tmp/uploads/logos" : path.join(__dirname, "../../../public/uploads/logos");

try {
    if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir, { recursive: true });
    if (!fs.existsSync(logosDir)) fs.mkdirSync(logosDir, { recursive: true });
} catch (err) {
    console.warn("⚠️ [Upload Warning] No se pudo crear directorios de certs/logos:", err.message);
}

// Configuración Multer Certificados
const certsStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, certsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const uploadCerts = multer({ storage: certsStorage });

// Configuración Multer Logo
const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, logosDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `logo-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const uploadLogo = multer({ storage: logoStorage });

const router = Router();

// Obtener Configuración Completa
router.get("/", verificarToken, getConfiguracion);

// Actualización de Configuración (JSON)
router.patch("/", verificarToken, validateBranding, actualizarConfiguracion);
router.put("/", verificarToken, validateBranding, actualizarConfiguracion);

// Aliases para compatibilidad con llamadas de negocio
router.post("/branding", verificarToken, validateBranding, actualizarConfiguracion);

// Carga de Certificados AFIP (Multipart)
router.post("/afip/certificados", verificarToken, uploadCerts.fields([
    { name: "certificado", maxCount: 1 },
    { name: "llavePrivada", maxCount: 1 }
]), subirCertificadosAfip);

router.put("/facturacion-config", verificarToken, uploadCerts.fields([
    { name: "certificado", maxCount: 1 },
    { name: "llavePrivada", maxCount: 1 }
]), subirCertificadosAfip);

// Carga de Logo (Multipart)
router.post("/logo", verificarToken, uploadLogo.single("logo"), subirLogo);

// Validación e Integración Mercado Pago
router.post("/mercadopago/validate", verificarToken, validateMercadoPago, validarMercadoPagoToken);

// Motivos de Cancelación (CRUD)
router.get("/motivos-cancelacion", verificarToken, listarMotivosCancelacion);
router.post("/motivos-cancelacion", verificarToken, crearMotivoCancelacion);
router.delete("/motivos-cancelacion/:id", verificarToken, eliminarMotivoCancelacion);

export default router;
