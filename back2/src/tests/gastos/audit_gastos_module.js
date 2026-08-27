import "dotenv/config";
import { connectionManager } from "../../models/connectionManager.js";
import { gastosService } from "../../modules/gastos/services/gastos.service.js";
import { categoriasGastosService } from "../../modules/gastos/services/categoriasGastos.service.js";
import { anulacionGastosService } from "../../modules/gastos/services/anulacionGastos.service.js";
import { cajasService } from "../../modules/finanzas/services/cajas.service.js";
import { AppError } from "../../utils/appError.js";

async function runGastosAudit() {
    console.log("🚀 INICIANDO AUDITORÍA Y PRUEBAS EN VIVO DEL MÓDULO DE GASTOS...\n");

    console.log("[TEST 1] Inicializando conexión central de DB (Neon DB)...");
    await connectionManager.initCentral();
    const negocioId = 13; // Negocio de auditoría activa
    console.log("✅ Conexión inicializada con éxito.\n");

    console.log("[TEST 2] Verificando Fail-Fast al omitir negocioId en gastosService...");
    try {
        await gastosService.obtenerGastos(null);
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

    console.log("[TEST 3] Verificando Fail-Fast en registro de gasto con monto inválido o ausente...");
    try {
        await gastosService.registrarGasto(negocioId, { monto: 0, metodoPagoId: 1 });
        console.error("❌ FALLO: Debería haber rechazado monto <= 0.");
        process.exit(1);
    } catch (err) {
        if (err instanceof AppError && err.code === "INVALID_EXPENSE_AMOUNT") {
            console.log("✅ Correcto: Lanzó AppError 400 (INVALID_EXPENSE_AMOUNT).\n");
        } else {
            console.error("❌ FALLO: Lanzó error inesperado:", err);
            process.exit(1);
        }
    }

    console.log("[TEST 4] Verificando Fail-Fast en registro de gasto sin método de pago...");
    try {
        await gastosService.registrarGasto(negocioId, { monto: 1500 });
        console.error("❌ FALLO: Debería haber rechazado método de pago ausente.");
        process.exit(1);
    } catch (err) {
        if (err instanceof AppError && err.code === "MISSING_PAYMENT_METHOD") {
            console.log("✅ Correcto: Lanzó AppError 400 (MISSING_PAYMENT_METHOD).\n");
        } else {
            console.error("❌ FALLO: Lanzó error inesperado:", err);
            process.exit(1);
        }
    }

    console.log("[TEST 5] Obteniendo y autosembrando categorías de gastos...");
    const categorias = await categoriasGastosService.obtenerCategorias(negocioId);
    console.log(`✅ Categorías de gastos obtenidas: ${categorias.length} categorías disponibles.`);

    console.log("\n[TEST 6] Creando una categoría de gasto de prueba...");
    const testCatNombre = `Auditoría Test ${Date.now()}`;
    const nuevaCat = await categoriasGastosService.crearCategoria(negocioId, {
        nombre: testCatNombre,
        descripcion: "Categoría temporal de prueba de auditoría"
    });
    console.log(`✅ Categoría creada exitosamente con ID ${nuevaCat.id}.`);

    console.log("\n[TEST 7] Verificando estado de caja abierta para registrar gasto...");
    let cajasAbiertas = await cajasService.obtenerCajasAbiertas(negocioId);
    let cajaActual = cajasAbiertas.length > 0 ? cajasAbiertas[0] : null;

    let cajaCreadaParaTest = false;
    if (!cajaActual) {
        console.log("⚠️ No hay caja abierta. Abriendo caja temporal de prueba...");
        cajaActual = await cajasService.abrirCaja(negocioId, { montoInicial: 5000, empleadoId: 1 });
        cajaCreadaParaTest = true;
        console.log("✅ Caja abierta para prueba.");
    } else {
        console.log(`✅ Caja abierta detectada ID: ${cajaActual.id || cajaActual.idCaja}.`);
    }

    console.log("\n[TEST 8] Registrando gasto atómico con egreso de caja en Neon DB...");
    const nuevoGasto = await gastosService.registrarGasto(negocioId, {
        monto: 1250.50,
        metodoPagoId: 1, // Efectivo
        categoriaGastoId: nuevaCat.id,
        descripcion: "Compra de detergente concentrado para pruebas",
        empleadoId: 1
    });

    console.log(`✅ Gasto registrado exitosamente con ID ${nuevoGasto.id} (Monto: $${nuevoGasto.montoTotal}).`);
    if (!nuevoGasto.movimientoCajaId) {
        console.error("❌ FALLO: El gasto no asoció un movimiento de caja.");
        process.exit(1);
    }
    console.log(`✅ Movimiento de caja asociado ID: ${nuevoGasto.movimientoCajaId}.`);

    console.log("\n[TEST 9] Obteniendo lista de gastos filtrados por fecha...");
    const gastosList = await gastosService.obtenerGastos(negocioId, { limit: 10 });
    console.log(`✅ Total de gastos recuperados: ${gastosList.total}.`);

    console.log("\n[TEST 10] Anulando el gasto de prueba atómicamente...");
    const anulacionRes = await anulacionGastosService.anularGasto(negocioId, nuevoGasto.id);
    console.log(`✅ Gasto ID ${anulacionRes.id} anulado correctamente (${anulacionRes.estadoGasto}).`);

    console.log("\n[TEST 11] Limpiando categoría de prueba...");
    await categoriasGastosService.eliminarCategoria(negocioId, nuevaCat.id);
    console.log("✅ Categoría de prueba eliminada.");

    if (cajaCreadaParaTest) {
        console.log("\n[TEST 12] Cerrando caja de prueba...");
        await cajasService.cerrarCaja(negocioId, cajaActual.idCaja || cajaActual.id, { efectivoReal: 5000 });
        console.log("✅ Caja de prueba cerrada.");
    }

    console.log("\n🎉 AUDITORÍA COMPLETA Y PRUEBAS DE INTEGRACIÓN DEL MÓDULO DE GASTOS EXITOSAS (100% PASS)!");
    process.exit(0);
}

runGastosAudit().catch((err) => {
    console.error("💥 FALLO EN LA AUDITORÍA DE GASTOS:", err);
    process.exit(1);
});
