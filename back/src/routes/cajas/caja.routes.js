import { Router } from "express";
import * as cajaController from "../../controllers/cajas/caja.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarSuscripcionActiva } from "../../middlewares/auth/subscription.middleware.js";
import { validarCampos } from "../../middlewares/validation.middleware.js";
import { abrirCajaValidator, cerrarCajaValidator } from "../../validators/cajas/caja.validator.js";

const router = Router();
router.use(verificarToken, verificarSuscripcionActiva);

router.get("/actual", cajaController.getCajaActual);
router.post("/abrir", abrirCajaValidator, validarCampos, cajaController.abrirCaja);
router.post("/:id/cerrar", cerrarCajaValidator, validarCampos, cajaController.cerrarCaja);

export default router;
