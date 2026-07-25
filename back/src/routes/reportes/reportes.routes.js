import { Router } from "express";
import { getServiciosReport, getPedidosReport, getEmpleadosReport } from "../../controllers/reportes/reportes.controller.js";
import { verificarToken } from "../../middlewares/auth/auth.middleware.js";
import { autorizarRoles } from "../../middlewares/auth/role.middleware.js";

const router = Router();

// Todos los reportes deben estar protegidos y ser accesibles por ADMIN (o MANAGER)
router.use(verificarToken);
router.use(autorizarRoles(["ADMIN"]));

// Reporte de Servicios
router.get("/servicios", getServiciosReport);

// Reporte de Pedidos
router.get("/pedidos", getPedidosReport);

// Reporte de Empleados
router.get("/empleados", getEmpleadosReport);

export default router;
