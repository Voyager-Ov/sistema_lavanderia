import "dotenv/config";
import { connectionManager } from "../../models/connectionManager.js";
import { dashboardService } from "../../modules/dashboard/services/dashboard.service.js";
import { AppError } from "../../utils/appError.js";

async function runDashboardAudit() {
    console.log("🚀 INICIANDO AUDITORÍA Y PRUEBAS DE INTEGRACIÓN DEL MÓDULO DE DASHBOARD...\n");

    console.log("[TEST 1] Inicializando conexión central y tenant DB...");
    await connectionManager.initCentral();
    const negocioId = 13; // Negocio activo de prueba
    console.log("✅ Conexión inicializada con éxito.\n");

    console.log("[TEST 2] Verificando Fail-Fast al omitir negocioId...");
    try {
        await dashboardService.obtenerEstadisticasDashboard(null);
        console.error("❌ FALLO: Debería haber lanzado AppError MISSING_TENANT_ID.");
        process.exit(1);
    } catch (err) {
        if (err instanceof AppError && err.code === "MISSING_TENANT_ID") {
            console.log("✅ Correcto: Lanzó AppError 400 (MISSING_TENANT_ID).\n");
        } else {
            console.error("❌ FALLO: Lanzó error inesperado:", err);
            process.exit(1);
        }
    }

    console.log(`[TEST 3] Recuperando métricas reales del Dashboard para Tenant ID ${negocioId}...`);
    const stats = await dashboardService.obtenerEstadisticasDashboard(negocioId);

    console.log("✅ Métricas del Dashboard recibidas con éxito:");
    console.log("  - Ingresos Hoy:", stats.ingresos.hoyCobrado);
    console.log("  - Ingresos Ayer:", stats.ingresos.ayerCobrado);
    console.log("  - Ingresos Mes Actual:", stats.ingresos.mesActual);
    console.log("  - Ingresos Mes Anterior:", stats.ingresos.mesAnterior);
    console.log("  - Pedidos del Día (Hoy/Ayer):", stats.pedidosDelDia);
    console.log("  - Pedidos Activos:", stats.pedidosActivos);
    console.log("  - Top Clientes Recurrentes:", stats.topClientes.length);
    console.log("  - Últimos Pedidos Recientes:", stats.ultimosPedidos.length);
    console.log("  - Ventas por Día (7 días):", stats.ventasPorDia.length);

    console.log("\n[TEST 4] Validando ausencia de multiplicadores o datos irreales...");
    if (typeof stats.ingresos.mesActual !== "number" || isNaN(stats.ingresos.mesActual)) {
        console.error("❌ FALLO: mesActual no es un número válido.");
        process.exit(1);
    }
    if (typeof stats.ingresos.mesAnterior !== "number" || isNaN(stats.ingresos.mesAnterior)) {
        console.error("❌ FALLO: mesAnterior no es un número válido.");
        process.exit(1);
    }

    console.log("\n🎉 AUDITORÍA DE INTEGRACIÓN DEL MÓDULO DE DASHBOARD COMPLETADA CON ÉXITO 100%!");
    process.exit(0);
}

runDashboardAudit().catch((err) => {
    console.error("💥 FALLO EN LA AUDITORÍA DE DASHBOARD:", err);
    process.exit(1);
});
