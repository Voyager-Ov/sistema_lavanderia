import { Router } from "express";
import {
    obtenerReportePedidos,
    obtenerReporteServicios,
    obtenerReporteVentasPorMetodoPago,
    obtenerReporteGeneralFinanzas,
    obtenerReporteEmpleados
} from "./controllers/reportes.controller.js";
import { validateReporteFechas } from "./validators/reportes.validator.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";
import { autorizarRoles } from "../../middlewares/role.middleware.js";

const router = Router();

// Todos los reportes gerenciales requieren autenticación y rol Administrador
router.use(verificarToken, autorizarRoles("ADMIN", "SUPERADMIN"));

router.get("/pedidos", validateReporteFechas, obtenerReportePedidos);
router.get("/servicios", validateReporteFechas, obtenerReporteServicios);
router.get("/ventas-metodo-pago", validateReporteFechas, obtenerReporteVentasPorMetodoPago);
router.get("/metodos-pago", validateReporteFechas, obtenerReporteVentasPorMetodoPago);
router.get("/finanzas", validateReporteFechas, obtenerReporteGeneralFinanzas);
router.get("/empleados", validateReporteFechas, obtenerReporteEmpleados);

export default router;
