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
import {
    validateServicio,
    validateServicioUpdate,
    validateBulkPrecios,
    validateBulkDisponibilidad
} from "./validators/servicios.validator.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración Multer en Memoria (evita EROFS en Vercel/Serverless)
const uploadProducto = multer({
    storage: multer.memoryStorage(),
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
router.put("/bulk/precios", verificarToken, validateBulkPrecios, actualizarPreciosMasivo);
router.patch("/bulk/precios", verificarToken, validateBulkPrecios, actualizarPreciosMasivo);
router.put("/bulk/disponibilidad", verificarToken, validateBulkDisponibilidad, actualizarDisponibilidadMasiva);
router.patch("/bulk/disponibilidad", verificarToken, validateBulkDisponibilidad, actualizarDisponibilidadMasiva);

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
router.put("/:id", verificarToken, uploadRateLimiter, uploadProducto.single("imagen"), validateServicioUpdate, actualizarServicio);

// Eliminar servicio
router.delete("/:id", verificarToken, eliminarServicio);

export default router;
