import "dotenv/config";
import { connectionManager } from "../../models/connectionManager.js";
import { cajasService } from "../../modules/finanzas/services/cajas.service.js";
import { pagosService } from "../../modules/finanzas/services/pagos.service.js";
import { AppError } from "../../utils/appError.js";

async function runFinanzasAudit() {
    console.log("🚀 INICIANDO AUDITORÍA Y PRUEBAS DE INTEGRACIÓN DEL MÓDULO DE FINANZAS...\n");

    console.log("[TEST 1] Inicializando conexión central de DB...");
    await connectionManager.initCentral();
    const negocioId = 13; // Negocio activo de prueba
    console.log("✅ Conexión inicializada con éxito.\n");

    console.log("[TEST 2] Verificando Fail-Fast en Cajas al omitir negocioId...");
    try {
        await cajasService.obtenerCajaActual(null);
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

    console.log("[TEST 3] Verificando Fail-Fast al intentar cobrar pedido inexistente...");
    try {
        await pagosService.procesarCobro(negocioId, {
            pedidosIds: [999999],
            empleadoId: 999999
        });
        console.error("❌ FALLO: Debería haber rechazado pedido inexistente.");
        process.exit(1);
    } catch (err) {
        if (err instanceof AppError && err.code === "ORDER_NOT_FOUND") {
            console.log("✅ Correcto: Lanzó AppError 404 (ORDER_NOT_FOUND).\n");
        } else {
            console.error("❌ FALLO: Lanzó error inesperado:", err);
            process.exit(1);
        }
    }

    console.log(`[TEST 4] Obteniendo Métodos de Pago del Tenant ID ${negocioId}...`);
    const metodos = await pagosService.obtenerMetodosPago(negocioId);
    console.log(`✅ Métodos de pago recuperados (${metodos.length} métodos disponibles).`);

    console.log("\n[TEST 5] Obteniendo Cajas Abiertas del Negocio...");
    const cajasAbiertas = await cajasService.obtenerCajasAbiertas(negocioId);
    console.log(`✅ Cajas abiertas recuperadas (${cajasAbiertas.length} cajas activas actualmente).`);

    console.log("\n🎉 AUDITORÍA DE INTEGRACIÓN DEL MÓDULO DE FINANZAS COMPLETADA CON ÉXITO 100%!");
    process.exit(0);
}

runFinanzasAudit().catch((err) => {
    console.error("💥 FALLO EN LA AUDITORÍA DE FINANZAS:", err);
    process.exit(1);
});
