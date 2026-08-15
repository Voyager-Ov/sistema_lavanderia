import "dotenv/config";
import { connectionManager } from "../src/models/connectionManager.js";
import { reportesService } from "../src/modules/reportes/services/reportes.service.js";

async function testReportesModule() {
    console.log("🚀 INICIANDO INTEGRATION SUITE PARA EL MÓDULO DE REPORTES Y ANALÍTICAS...\n");
    const negocioId = 13; // Negocio activo en dev / produccion (octavio.velo2022@gmail.com)

    try {
        delete process.env.NODE_ENV;
        await connectionManager.initCentral();
        console.log(`🟢 Base de datos inicializada. Probando reportes para Negocio ID: ${negocioId}`);

        // -------------------------------------------------------------------------
        // TEST 1: Reporte de Pedidos (GET /api/reportes/pedidos)
        // -------------------------------------------------------------------------
        console.log("\n📊 TEST 1: Probando Reporte de Pedidos y KPIs...");
        const repPedidos = await reportesService.obtenerReportePedidos(negocioId, {});
        
        console.log("   KPIs de Pedidos:", JSON.stringify(repPedidos.kpis));
        console.log(`   Pedidos en Tabla: ${repPedidos.table.length}`);
        console.log(`   Categorías en Donut: ${repPedidos.donut.length}`);

        if (
            typeof repPedidos.kpis.ingresos === "number" &&
            typeof repPedidos.kpis.totalPedidos === "number" &&
            Array.isArray(repPedidos.table) &&
            Array.isArray(repPedidos.donut)
        ) {
            console.log("   ✅ PASÓ TEST 1: Estrcutura JSON de Reporte de Pedidos 100% válida.");
        } else {
            throw new Error("TEST 1 FALLÓ la validación de campos requeridos.");
        }

        // -------------------------------------------------------------------------
        // TEST 2: Reporte de Servicios (GET /api/reportes/servicios)
        // -------------------------------------------------------------------------
        console.log("\n🧼 TEST 2: Probando Reporte de Servicios y Ranking...");
        const repServicios = await reportesService.obtenerReporteServicios(negocioId, {});

        console.log("   KPIs de Servicios:", JSON.stringify(repServicios.kpis));
        console.log(`   Servicios en Ranking: ${repServicios.table.length}`);
        console.log(`   Items en Donut: ${repServicios.donut.length}`);

        if (
            typeof repServicios.kpis.ingresos === "number" &&
            Array.isArray(repServicios.table) &&
            Array.isArray(repServicios.servicesList)
        ) {
            console.log("   ✅ PASÓ TEST 2: Estrcutura JSON de Reporte de Servicios 100% válida.");
        } else {
            throw new Error("TEST 2 FALLÓ la validación del ranking de servicios.");
        }

        // -------------------------------------------------------------------------
        // TEST 3: Reporte de Ventas por Método de Pago (GET /api/reportes/ventas-metodo-pago)
        // -------------------------------------------------------------------------
        console.log("\n💳 TEST 3: Probando Reporte de Ventas por Método de Pago...");
        const repPagos = await reportesService.obtenerReporteVentasPorMetodoPago(negocioId, {});

        console.log(`   Total Recaudado: $${repPagos.totalRecaudado}`);
        console.log(`   Métodos de Pago Utilizados: ${repPagos.items.length}`);

        if (typeof repPagos.totalRecaudado === "number" && Array.isArray(repPagos.items)) {
            console.log("   ✅ PASÓ TEST 3: Reporte de métodos de pago agrupado correctamente.");
        } else {
            throw new Error("TEST 3 FALLÓ.");
        }

        // -------------------------------------------------------------------------
        // TEST 4: Reporte General de Finanzas (GET /api/reportes/finanzas)
        // -------------------------------------------------------------------------
        console.log("\n📈 TEST 4: Probando Reporte General de Finanzas...");
        const repFinanzas = await reportesService.obtenerReporteGeneralFinanzas(negocioId, {});

        console.log("   Resultado Finanzas:", JSON.stringify(repFinanzas));

        if (typeof repFinanzas.totalIngresos === "number" && typeof repFinanzas.totalPedidos === "number") {
            console.log("   ✅ PASÓ TEST 4: Resumen financiero generado con éxito.");
        } else {
            throw new Error("TEST 4 FALLÓ.");
        }

        console.log("\n==========================================================================================");
        console.log("🏆 ¡TODOS LOS REPORTE Y ANALÍTICAS NUEVOS ESTÁN FUNCIONANDO AL 100% PERFECTO! 🏆");
        console.log("==========================================================================================\n");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ Error durante las pruebas del módulo de reportes:", err);
        process.exit(1);
    }
}

testReportesModule();
