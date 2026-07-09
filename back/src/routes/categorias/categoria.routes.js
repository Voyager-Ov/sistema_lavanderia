import { Router } from "express";
import * as categoriaController from "../../controllers/categorias/categoria.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarSuscripcionActiva } from "../../middlewares/auth/subscription.middleware.js";
import { validarCampos } from "../../middlewares/validation.middleware.js";
import { categoriaValidator } from "../../validators/categorias/categoria.validator.js";
import { verificarRol } from "../../middlewares/role.middleware.js";

const router = Router();
router.use(verificarToken, verificarSuscripcionActiva);

router.get("/", categoriaController.getCategorias);
router.post("/", verificarRol(["admin"]), categoriaValidator, validarCampos, categoriaController.crearCategoria);
router.put("/:id", verificarRol(["admin"]), categoriaValidator, validarCampos, categoriaController.actualizarCategoria);
router.delete("/:id", verificarRol(["admin"]), categoriaController.eliminarCategoria);

export default router;
