import { Router } from "express";
import {
    listarCategorias,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria
} from "./controllers/servicios.controller.js";
import { validateCategoria } from "./validators/servicios.validator.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

// Listar categorías
router.get("/", verificarToken, listarCategorias);

// Crear categoría
router.post("/", verificarToken, validateCategoria, crearCategoria);

// Actualizar categoría
router.put("/:id", verificarToken, validateCategoria, actualizarCategoria);

// Eliminar categoría
router.delete("/:id", verificarToken, eliminarCategoria);

export default router;
