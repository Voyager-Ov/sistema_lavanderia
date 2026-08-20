import { Router } from "express";
import {
    obtenerEmpleados,
    crearEmpleado,
    obtenerEmpleadoPorId,
    actualizarEmpleado
} from "./controllers/empleados.controller.js";
import { cambiarEstadoEmpleado } from "./controllers/estadoEmpleados.controller.js";
import { obtenerMetricasEmpleado } from "./controllers/desempenoEmpleados.controller.js";
import { validateCrearEmpleado } from "./validators/empleados.validator.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";
import { autorizarRoles } from "../../middlewares/role.middleware.js";

const router = Router();

// Todas las rutas de gestión de personal requieren autenticación y rol Administrador
router.use(verificarToken, autorizarRoles("ADMIN", "SUPERADMIN"));

// CRUD de Empleados / Usuarios del Tenant
router.get("/", obtenerEmpleados);
router.get("/empleados", obtenerEmpleados);
router.post("/", validateCrearEmpleado, crearEmpleado);
router.post("/empleados", validateCrearEmpleado, crearEmpleado);
router.get("/:id", obtenerEmpleadoPorId);
router.put("/:id", actualizarEmpleado);
router.patch("/:id/estado", cambiarEstadoEmpleado);
router.get("/:id/metricas", obtenerMetricasEmpleado);

export default router;
