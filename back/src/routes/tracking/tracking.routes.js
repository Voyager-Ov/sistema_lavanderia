import { Router } from "express";
import * as trackingController from "../../controllers/tracking/tracking.controller.js";

const router = Router();

// RUTA PÚBLICA: No requiere JWT ni middleware de suscripción,
// ya que un cliente final no tiene usuario en el sistema.
router.get("/:codigo", trackingController.getTrackingPedido);

export default router;
