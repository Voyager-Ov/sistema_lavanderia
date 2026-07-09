import { Router } from "express";
import * as gastoController from "../../controllers/gastos/gasto.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarSuscripcionActiva } from "../../middlewares/auth/subscription.middleware.js";
import { validarCampos } from "../../middlewares/validation.middleware.js";
import { registrarGastoValidator } from "../../validators/gastos/gasto.validator.js";

const router = Router();
router.use(verificarToken, verificarSuscripcionActiva);

router.get("/", gastoController.getGastos);
router.post("/", registrarGastoValidator, validarCampos, gastoController.registrarGasto);

export default router;
