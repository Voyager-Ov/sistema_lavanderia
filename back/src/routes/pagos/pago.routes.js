import { Router } from "express";
import * as pagoController from "../../controllers/pagos/pago.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarSuscripcionActiva } from "../../middlewares/auth/subscription.middleware.js";
import { validarCampos } from "../../middlewares/validation.middleware.js";
import { registrarPagoValidator } from "../../validators/pagos/pago.validator.js";

const router = Router();
router.use(verificarToken, verificarSuscripcionActiva);

router.get("/metodos", pagoController.obtenerMetodosPago);
router.post("/metodos", validarCampos, pagoController.crearMetodoPago);
router.patch("/metodos/:id", pagoController.toggleMetodoPago);
router.delete("/metodos/:id", pagoController.eliminarMetodoPago);

router.post("/", registrarPagoValidator, validarCampos, pagoController.registrarPago);
router.post("/:id/facturar", pagoController.facturarPagoRetroactivo);
router.patch("/:id/anular", pagoController.anularPago);
router.get("/saldos-a-favor/:clienteId", pagoController.obtenerSaldosAFavor);

export default router;
