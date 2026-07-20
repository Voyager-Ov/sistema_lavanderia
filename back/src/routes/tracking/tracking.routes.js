import { Router } from "express";
import * as trackingController from "../../controllers/tracking/tracking.controller.js";

const router = Router();

// Endpoint público para tracking
router.get("/:negocioId/:codigo", trackingController.getTrackingInfo);

export default router;
