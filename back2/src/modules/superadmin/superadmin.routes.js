import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
    getDashboard,
    getHealthCheck,
    getNegocios,
    updateStatus,
    updateEstadoSuscripcion,
    getSolicitudes,
    aprobarSolicitud,
    rechazarSolicitud,
    getNegocioAlmacenamiento,
    updateNegocioLimites,
    getNegocioImagenes,
    deleteNegocioImagenes,
    createMensaje,
    getMensajes,
    desactivarMensaje,
    getLogsSeguridad
} from "./controllers/superadmin.controller.js";
import { login } from "../auth/controllers/auth.controller.js";
import { superAdminAuth } from "../../middlewares/superadmin.middleware.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

// Rate Limiter estricto para el portal SuperAdmin
const superAdminRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Máximo 100 peticiones por IP cada 15 minutos
    message: { error: "Has superado el límite de operaciones administrativas. Por seguridad, la IP ha sido limitada temporalmente." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === "test"
});

const router = Router();

// Ruta pública de Login para SuperAdmin (Sin exigir token previo)
router.post("/login", superAdminRateLimiter, login);

// Rutas protegidas (Rate Limiter + Token + SuperAdmin Role RBAC)
router.use(superAdminRateLimiter, verificarToken, superAdminAuth);

router.get("/dashboard", getDashboard);
router.get("/health-check", getHealthCheck);
router.get("/negocios", getNegocios);
router.put("/negocios/:id/status", updateStatus);
router.patch("/negocios/:id/estado", updateEstadoSuscripcion);

// Solicitudes de Registro
router.get("/solicitudes", getSolicitudes);
router.patch("/solicitudes/:id/aprobar", aprobarSolicitud);
router.patch("/solicitudes/:id/rechazar", rechazarSolicitud);

// Almacenamiento, Cuotas e Imágenes por Negocio
router.get("/negocios/:id/almacenamiento", getNegocioAlmacenamiento);
router.put("/negocios/:id/limites", updateNegocioLimites);
router.get("/negocios/:id/imagenes", getNegocioImagenes);
router.delete("/negocios/:id/imagenes", deleteNegocioImagenes);

// Mensajería Broadcast y Anuncios
router.post("/mensajes", createMensaje);
router.get("/mensajes", getMensajes);
router.patch("/mensajes/:id/desactivar", desactivarMensaje);

// Auditoría de Seguridad
router.get("/seguridad/logs", getLogsSeguridad);

export default router;
