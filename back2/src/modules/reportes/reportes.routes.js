import { Router } from "express";
import {
    obtenerReportePedidos,
    obtenerReporteServicios,
    obtenerReporteVentasPorMetodoPago,
    obtenerReporteGeneralFinanzas,
    obtenerReporteEmpleados
} from "./controllers/reportes.controller.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";
import { autorizarRoles } from "../../middlewares/role.middleware.js";

const router = Router();

// Todos los reportes gerenciales requieren autenticación y rol Administrador
router.use(verificarToken, autorizarRoles("ADMIN", "SUPERADMIN"));

router.get("/pedidos", obtenerReportePedidos);
router.get("/servicios", obtenerReporteServicios);
router.get("/ventas-metodo-pago", obtenerReporteVentasPorMetodoPago);
router.get("/metodos-pago", obtenerReporteVentasPorMetodoPago);
router.get("/finanzas", obtenerReporteGeneralFinanzas);
router.get("/empleados", obtenerReporteEmpleados);

export default router;
