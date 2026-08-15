import { Router } from "express";
import {
    obtenerReportePedidos,
    obtenerReporteServicios,
    obtenerReporteVentasPorMetodoPago,
    obtenerReporteGeneralFinanzas,
    obtenerReporteEmpleados
} from "./controllers/reportes.controller.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/pedidos", verificarToken, obtenerReportePedidos);
router.get("/servicios", verificarToken, obtenerReporteServicios);
router.get("/ventas-metodo-pago", verificarToken, obtenerReporteVentasPorMetodoPago);
router.get("/metodos-pago", verificarToken, obtenerReporteVentasPorMetodoPago);
router.get("/finanzas", verificarToken, obtenerReporteGeneralFinanzas);
router.get("/empleados", verificarToken, obtenerReporteEmpleados);

export default router;
