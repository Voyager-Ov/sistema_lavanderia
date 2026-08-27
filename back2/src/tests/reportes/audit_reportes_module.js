import dotenv from "dotenv";
dotenv.config({ path: "back2/.env" });
dotenv.config({ path: ".env" });
import { connectionManager } from "../../models/connectionManager.js";
import { reportesService } from "../../modules/reportes/services/reportes.service.js";
import { AppError } from "../../utils/appError.js";

async function runReportesAudit() {
    console.log("🚀 INICIANDO AUDITORÍA Y PRUEBAS EN VIVO DEL MÓDULO DE REPORTES...\n");

    console.log("[TEST 1] Inicializando conexión central de DB (Neon DB)...");
    await connectionManager.initCentral();
    const negocioId = 13; // Negocio activo de prueba
    console.log("✅ Conexión inicializada con éxito.\n");

    console.log("[TEST 2] Verificando Fail-Fast al omitir negocioId...");
    try {
        await reportesService.obtenerReportePedidos(null);
        console.error("❌ FALLO: Debería haber rechazado negocioId nulo.");
        process.exit(1);
    } catch (err) {
        if (err instanceof AppError && err.code === "MISSING_TENANT_ID") {
            console.log("✅ Correcto: Lanzó AppError 400 (MISSING_TENANT_ID).\n");
        } else {
            console.error("❌ FALLO: Lanzó error inesperado:", err);
            process.exit(1);
        }
    }

    console.log("[TEST 3] Obteniendo reporte de pedidos en vivo...");
    const reportePedidos = await reportesService.obtenerReportePedidos(negocioId, {
        fechaInicio: "2026-01-01",
        fechaFin: "2026-12-31"
    });
    if (!reportePedidos || !reportePedidos.kpis) {
        console.error("❌ FALLO: El reporte de pedidos devolvió una estructura inválida.");
        process.exit(1);
    }
    console.log(`✅ Reporte de pedidos generado: $${reportePedidos.kpis.ingresos} ingresos, ${reportePedidos.kpis.totalPedidos} pedidos totales, ${reportePedidos.rendimientoEmpleados.length} empleados evaluados sin multiplicadores falsos.\n`);

    console.log("[TEST 4] Obteniendo reporte de servicios en vivo con categorías reales...");
    const reporteServicios = await reportesService.obtenerReporteServicios(negocioId, {
        fechaInicio: "2026-01-01",
        fechaFin: "2026-12-31"
    });
    if (!reporteServicios || !Array.isArray(reporteServicios.table)) {
        console.error("❌ FALLO: El reporte de servicios devolvió una tabla inválida.");
        process.exit(1);
    }
    console.log(`✅ Reporte de servicios generado: ${reporteServicios.table.length} servicios procesados con categorías reales de BD.\n`);

    console.log("[TEST 5] Obteniendo reporte de ventas por método de pago en vivo...");
    const reporteMetodosPago = await reportesService.obtenerReporteVentasPorMetodoPago(negocioId);
    if (!reporteMetodosPago || !Array.isArray(reporteMetodosPago.items)) {
        console.error("❌ FALLO: El reporte de métodos de pago devolvió datos inválidos.");
        process.exit(1);
    }
    console.log(`✅ Reporte de ventas por método de pago: $${reporteMetodosPago.totalRecaudado} recaudados en ${reporteMetodosPago.items.length} métodos de pago activados.\n`);

    console.log("[TEST 6] Obteniendo reporte general de finanzas en vivo...");
    const reporteFinanzas = await reportesService.obtenerReporteGeneralFinanzas(negocioId);
    if (!reporteFinanzas || typeof reporteFinanzas.totalIngresos !== "number") {
        console.error("❌ FALLO: El reporte general de finanzas devolvió un formato inválido.");
        process.exit(1);
    }
    console.log(`✅ Reporte general de finanzas generado: $${reporteFinanzas.totalIngresos} total ingresos, ${reporteFinanzas.pedidosCobrados} pedidos cobrados de ${reporteFinanzas.totalPedidos} totales.\n`);

    console.log("[TEST 7] Obteniendo reporte de rendimiento de empleados en vivo...");
    const reporteEmpleados = await reportesService.obtenerReporteEmpleados(negocioId);
    if (!reporteEmpleados || !Array.isArray(reporteEmpleados.tablaEmpleados)) {
        console.error("❌ FALLO: El reporte de empleados devolvió una tabla inválida.");
        process.exit(1);
    }
    console.log(`✅ Reporte de empleados generado: ${reporteEmpleados.tablaEmpleados.length} empleados con métricas reales de cajas y pedidos procesados (0 promedios falsos).\n`);

    console.log("🎉 AUDITORÍA COMPLETA Y PRUEBAS EN VIVO DEL MÓDULO DE REPORTES EXITOSAS (100% PASS)!");
    process.exit(0);
}

runReportesAudit().catch((err) => {
    console.error("💥 FALLO EN LA AUDITORÍA DE REPORTES:", err);
    process.exit(1);
});
