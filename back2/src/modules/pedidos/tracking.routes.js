import { Router } from "express";
import { obtenerTrackingPublico } from "./controllers/pedidos.controller.js";

const router = Router();

// Endpoint público para consulta de seguimiento online (sin requerir token JWT)
router.get("/:negocioId/:codigo", obtenerTrackingPublico);

export default router;
