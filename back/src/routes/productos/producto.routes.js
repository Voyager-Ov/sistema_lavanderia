import { Router } from "express";
import * as productoController from "../../controllers/productos/producto.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarSuscripcionActiva } from "../../middlewares/auth/subscription.middleware.js";
import { validarCampos } from "../../middlewares/validation.middleware.js";
import { crearProductoValidator, actualizarProductoValidator, editarDisponibilidadValidator } from "../../validators/productos/producto.validator.js";
import { verificarRol } from "../../middlewares/role.middleware.js";

const router = Router();
router.use(verificarToken, verificarSuscripcionActiva);

router.get("/", productoController.getProductos);
router.post("/", verificarRol(["admin"]), crearProductoValidator, validarCampos, productoController.crearProducto);
router.put("/:id", verificarRol(["admin"]), actualizarProductoValidator, validarCampos, productoController.actualizarProducto);
router.patch("/:id/disponibilidad", verificarRol(["admin", "empleado"]), editarDisponibilidadValidator, validarCampos, productoController.actualizarDisponibilidad);
router.delete("/:id", verificarRol(["admin"]), productoController.eliminarProducto);

export default router;
