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

const router = Router();

// CRUD de Empleados / Usuarios del Tenant
router.get("/", verificarToken, obtenerEmpleados);
router.get("/empleados", verificarToken, obtenerEmpleados);
router.post("/", verificarToken, validateCrearEmpleado, crearEmpleado);
router.post("/empleados", verificarToken, validateCrearEmpleado, crearEmpleado);
router.get("/:id", verificarToken, obtenerEmpleadoPorId);
router.put("/:id", verificarToken, actualizarEmpleado);
router.patch("/:id/estado", verificarToken, cambiarEstadoEmpleado);
router.get("/:id/metricas", verificarToken, obtenerMetricasEmpleado);

export default router;
