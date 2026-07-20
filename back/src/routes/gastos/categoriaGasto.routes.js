import { Router } from "express";
import * as categoriaGastoController from "../../controllers/gastos/categoriaGasto.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarSuscripcionActiva } from "../../middlewares/auth/subscription.middleware.js";

const router = Router();
router.use(verificarToken, verificarSuscripcionActiva);

router.get("/", categoriaGastoController.getCategorias);
router.post("/", categoriaGastoController.createCategoria);
router.delete("/:id", categoriaGastoController.deleteCategoria);

export default router;
