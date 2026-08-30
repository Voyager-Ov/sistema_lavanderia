import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { connectionManager } from "../models/connectionManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");

dotenv.config({ path: path.join(projectRoot, ".env") });

const testSuites = [
    { name: "Módulo Auth", script: path.join(__dirname, "test_auth.js") },
    { name: "Módulo Clientes", script: path.join(__dirname, "clientes/audit_clientes_module.js") },
    { name: "Módulo Configuración", script: path.join(__dirname, "configuracion/audit_configuracion_module.js") },
    { name: "Módulo Pedidos", script: path.join(__dirname, "pedidos/audit_pedidos_module.js") },
    { name: "Módulo Finanzas", script: path.join(__dirname, "finanzas/audit_finanzas_module.js") },
    { name: "Módulo Gastos", script: path.join(__dirname, "gastos/audit_gastos_module.js") },
    { name: "Módulo Servicios", script: path.join(__dirname, "servicios/audit_servicios_module.js") },
    { name: "Módulo RRHH / Empleados", script: path.join(__dirname, "rrhh/audit_rrhh_module.js") },
    { name: "Módulo Reportes", script: path.join(__dirname, "reportes/audit_reportes_module.js") },
    { name: "Módulo Dashboard", script: path.join(__dirname, "dashboard/audit_dashboard_module.js") }
];

async function runMasterTestSuite() {
    console.log("==========================================================");
    console.log("🚀 EJECUTANDO SUITE MAESTRA DE AUTOMATIZACIÓN DE PRUEBAS");
    console.log("==========================================================\n");

    const startTime = Date.now();
    let passed = 0;
    let failed = 0;

    for (const suite of testSuites) {
        console.log(`▶ Running [${suite.name}] (${suite.script})...`);
        try {
            execSync(`node "${suite.script}"`, {
                cwd: projectRoot,
                stdio: "inherit",
                env: { ...process.env }
            });
            console.log(`✅ [${suite.name}] PASSED.\n`);
            passed++;
        } catch (error) {
            console.error(`❌ [${suite.name}] FAILED.\n`);
            failed++;
            break;
        }
    }

    console.log("==========================================================");
    console.log(`📊 RESUMEN DE PRUEBAS: ${passed} Pasadas | ${failed} Falladas`);
    console.log("==========================================================\n");

    // TEARDOWN CLEANUP: Eliminar esquemas tenant de prueba para dejar la BD limpia
    const isCleanRequested = process.argv.includes("--clean") || process.env.CI === "true";
    const testNegocioId = 13;

    if (failed === 0 && isCleanRequested) {
        console.log("🧹 INICIANDO TEARDOWN: Eliminando esquema de pruebas en PostgreSQL...");
        try {
            await connectionManager.initCentral();
            await connectionManager.dropTenantSchema(testNegocioId);
            if (connectionManager.centralDb) {
                await connectionManager.centralDb.close();
            }
        } catch (err) {
            console.warn("⚠️ Advertencia durante teardown de BD:", err.message);
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ Tiempo total de ejecución: ${duration}s`);

    if (failed > 0) {
        console.error("💥 LA SUITE DE PRUEBAS FALLÓ.");
        process.exit(1);
    } else {
        console.log("🎉 SUITE DE PRUEBAS COMPLETADA CON 100% ÉXITO!");
        process.exit(0);
    }
}

runMasterTestSuite();
