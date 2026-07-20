import { Router } from "express";
import * as productoController from "../../controllers/productos/producto.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { verificarSuscripcionActiva } from "../../middlewares/auth/subscription.middleware.js";
import { validarCampos } from "../../middlewares/validation.middleware.js";
import { crearProductoValidator, actualizarProductoValidator, editarDisponibilidadValidator } from "../../validators/productos/producto.validator.js";
import { verificarRol } from "../../middlewares/role.middleware.js";
import { uploadProductoImagen } from "../../middlewares/upload.middleware.js";

const router = Router();
router.use(verificarToken, verificarSuscripcionActiva);

router.get("/", productoController.getProductos);
router.get("/stats", verificarRol(["admin", "empleado"]), productoController.obtenerStatsProductos);
router.post("/", verificarRol(["admin"]), uploadProductoImagen.single("imagen"), crearProductoValidator, validarCampos, productoController.crearProducto);
router.put("/bulk/precios", verificarRol(["admin"]), productoController.actualizarPreciosMasivo);
router.patch("/bulk/disponibilidad", verificarRol(["admin", "empleado"]), productoController.actualizarDisponibilidadMasiva);
router.get("/:id", verificarRol(["admin", "empleado"]), productoController.getProductoById);
router.put("/:id", verificarRol(["admin"]), uploadProductoImagen.single("imagen"), actualizarProductoValidator, validarCampos, productoController.actualizarProducto);
router.patch("/:id/disponibilidad", verificarRol(["admin", "empleado"]), editarDisponibilidadValidator, validarCampos, productoController.actualizarDisponibilidad);
router.delete("/:id", verificarRol(["admin"]), productoController.eliminarProducto);
router.get("/:id/historial", verificarRol(["admin", "empleado"]), productoController.obtenerHistorialPrecios);

export default router;
