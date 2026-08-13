import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import {
    listarServicios,
    obtenerEstadisticas,
    obtenerServicioPorId,
    crearServicio,
    actualizarServicio,
    eliminarServicio
} from "./controllers/servicios.controller.js";
import { validateServicio } from "./validators/servicios.validator.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio para imágenes de productos/servicios
const productosDir = path.join(__dirname, "../../../public/uploads/productos");
if (!fs.existsSync(productosDir)) fs.mkdirSync(productosDir, { recursive: true });

const productosStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, productosDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `prod-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const uploadProducto = multer({
    storage: productosStorage,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB máximo
});

const router = Router();

// Estadísticas de productos / servicios
router.get("/stats", verificarToken, obtenerEstadisticas);

// Listar servicios
router.get("/", verificarToken, listarServicios);

// Obtener por ID
router.get("/:id", verificarToken, obtenerServicioPorId);

// Crear servicio (Form Data + Imagen)
router.post("/", verificarToken, uploadProducto.single("imagen"), validateServicio, crearServicio);

// Actualizar servicio (Form Data + Imagen)
router.put("/:id", verificarToken, uploadProducto.single("imagen"), validateServicio, actualizarServicio);

// Eliminar servicio
router.delete("/:id", verificarToken, eliminarServicio);

export default router;
