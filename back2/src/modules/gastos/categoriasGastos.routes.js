import { Router } from "express";
import { obtenerCategorias, crearCategoria, eliminarCategoria } from "./controllers/categoriasGastos.controller.js";
import { validateCrearCategoriaGasto } from "./validators/categoriasGastos.validator.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verificarToken, obtenerCategorias);
router.post("/", verificarToken, validateCrearCategoriaGasto, crearCategoria);
router.delete("/:id", verificarToken, eliminarCategoria);

export default router;
