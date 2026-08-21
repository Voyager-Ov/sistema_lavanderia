import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";

import {
    listarServicios,
    obtenerEstadisticas,
    obtenerServicioPorId,
    crearServicio,
    actualizarServicio,
    cambiarDisponibilidad,
    actualizarPreciosMasivo,
    actualizarDisponibilidadMasiva,
    obtenerHistorialPrecios,
    eliminarServicio
} from "./controllers/servicios.controller.js";
import { validateServicio } from "./validators/servicios.validator.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio para imágenes de productos/servicios
const productosDir = process.env.VERCEL ? "/tmp/uploads/productos" : path.join(__dirname, "../../../public/uploads/productos");
try {
    if (!fs.existsSync(productosDir)) fs.mkdirSync(productosDir, { recursive: true });
} catch (err) {
    console.warn("⚠️ [Upload Warning] No se pudo crear directorio de productos:", err.message);
}

const productosStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, productosDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `prod-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const uploadProducto = multer({
    storage: productosStorage,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB máximo por archivo original
});

// Rate Limiter estricto anti-fraude y anti-DDoS para subidas de imágenes
const uploadRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 15, // Máximo 15 subidas de archivos por ventana de 15 minutos
    message: { error: "Has superado el límite de subida de imágenes (máximo 15 subidas cada 15 minutos). Por seguridad se ha bloqueado temporalmente la acción." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === "test"
});

const router = Router();

// Estadísticas de productos / servicios
router.get("/stats", verificarToken, obtenerEstadisticas);

// Acciones masivas (Deben ir ANTES de /:id para evitar choques de parámetros)
router.put("/bulk/precios", verificarToken, actualizarPreciosMasivo);
router.patch("/bulk/precios", verificarToken, actualizarPreciosMasivo);
router.put("/bulk/disponibilidad", verificarToken, actualizarDisponibilidadMasiva);
router.patch("/bulk/disponibilidad", verificarToken, actualizarDisponibilidadMasiva);

// Listar servicios
router.get("/", verificarToken, listarServicios);

// Obtener historial de precios por ID
router.get("/:id/historial", verificarToken, obtenerHistorialPrecios);

// Cambiar disponibilidad individual
router.patch("/:id/disponibilidad", verificarToken, cambiarDisponibilidad);
router.put("/:id/disponibilidad", verificarToken, cambiarDisponibilidad);

// Obtener por ID
router.get("/:id", verificarToken, obtenerServicioPorId);

// Crear servicio (Form Data + Imagen + Rate Limiter)
router.post("/", verificarToken, uploadRateLimiter, uploadProducto.single("imagen"), validateServicio, crearServicio);

// Actualizar servicio (Form Data + Imagen + Rate Limiter)
router.put("/:id", verificarToken, uploadRateLimiter, uploadProducto.single("imagen"), validateServicio, actualizarServicio);

// Eliminar servicio
router.delete("/:id", verificarToken, eliminarServicio);

export default router;
