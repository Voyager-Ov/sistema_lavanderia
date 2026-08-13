import { Router } from "express";
import { registrarGasto, obtenerGastos, obtenerGastoPorId } from "./controllers/gastos.controller.js";
import { anularGasto } from "./controllers/anulacionGastos.controller.js";
import { validateCrearGasto } from "./validators/gastos.validator.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verificarToken, obtenerGastos);
router.post("/", verificarToken, validateCrearGasto, registrarGasto);
router.get("/:id", verificarToken, obtenerGastoPorId);
router.patch("/:id/anular", verificarToken, anularGasto);

export default router;
