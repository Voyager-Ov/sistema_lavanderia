import { Router } from "express";
import * as usuarioController from "../../controllers/usuarios/usuario.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarSuscripcionActiva } from "../../middlewares/auth/subscription.middleware.js";
import { validarCampos } from "../../middlewares/validation.middleware.js";
import { crearUsuarioValidator, editarUsuarioValidator } from "../../validators/usuarios/usuario.validator.js";

import { verificarRol } from "../../middlewares/role.middleware.js";

const router = Router();

// Middleware global para todas las rutas de usuario: 
// 1. Debe estar logueado (verificarToken)
// 2. El negocio debe tener la suscripción activa (verificarSuscripcionActiva)
router.use(verificarToken, verificarSuscripcionActiva);

router.get("/", usuarioController.getUsuarios);
router.get("/:id", usuarioController.getUsuarioById);
router.post("/", verificarRol(["ADMIN"]), crearUsuarioValidator, validarCampos, usuarioController.crearUsuario);
router.put("/:id", verificarRol(["ADMIN"]), editarUsuarioValidator, validarCampos, usuarioController.actualizarUsuario);
router.patch("/:id/estado", verificarRol(["ADMIN"]), usuarioController.desactivarUsuario); // Sin validador duro de motivo para usuario por ahora

export default router;
