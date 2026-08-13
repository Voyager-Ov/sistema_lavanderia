import { Router } from "express";
import {
    obtenerReporteVentasPorMetodoPago,
    obtenerReporteGeneralFinanzas
} from "./controllers/reportes.controller.js";
import { verificarToken } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/ventas-metodo-pago", verificarToken, obtenerReporteVentasPorMetodoPago);
router.get("/metodos-pago", verificarToken, obtenerReporteVentasPorMetodoPago);
router.get("/finanzas", verificarToken, obtenerReporteGeneralFinanzas);

export default router;
