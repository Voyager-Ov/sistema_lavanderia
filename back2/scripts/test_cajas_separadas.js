import "dotenv/config";
import { connectionManager } from "../src/models/connectionManager.js";
import { cajasService } from "../src/modules/finanzas/services/cajas.service.js";
import { pagosService } from "../src/modules/finanzas/services/pagos.service.js";
import { gastosService } from "../src/modules/gastos/services/gastos.service.js";

async function runTest() {
    const negocioId = 13; // Tenant de prueba activo (octavio.velo2022@gmail.com)
    console.log(`=== INICIANDO AUDITORIA CRUZADA: AISLAMIENTO DE CAJAS POR USUARIO (Tenant: ${negocioId}) ===\n`);

    try {
        delete process.env.NODE_ENV;
        await connectionManager.initCentral();

        const models = await connectionManager.getTenantDb(negocioId);
        const { Empleado, Caja, MovimientoCaja } = models.models;

        // 1. Obtener 2 empleados para la prueba
        const empleados = await Empleado.findAll({ limit: 2 });
        if (empleados.length < 1) {
            console.log("⚠️ No se encontraron empleados para la prueba.");
            process.exit(0);
        }

        const emp1 = empleados[0];
        const emp2 = empleados[1] || emp1;

        console.log(`[TEST 1] Verificando caja actual para Empleado 1 (ID: ${emp1.id} - ${emp1.nombre})`);
        const cajaEmp1Inicial = await cajasService.obtenerCajaActual(negocioId, emp1.id);
        console.log(`   Resultado: ${cajaEmp1Inicial ? `Caja ID #${cajaEmp1Inicial.id} (${cajaEmp1Inicial.estado})` : 'Sin caja previa'}`);

        console.log(`\n[TEST 2] Verificando consulta sin empleadoId (Llamada anonima/sistema)`);
        const cajaAnonima = await cajasService.obtenerCajaActual(negocioId, null);
        if (cajaAnonima === null) {
            console.log("   ✅ CORRECTO: Consulta sin empleadoId retorno NULL en lugar de devolver la caja de otro usuario.");
        } else {
            console.error("   ❌ ERROR: Consulta sin empleadoId retorno una caja cuando debia retornar NULL:", cajaAnonima?.id);
        }

        console.log(`\n[TEST 3] Intentando registrar gasto sin caja abierta para un usuario sin turno`);
        const empIdSinCaja = 999999;
        try {
            await gastosService.registrarGasto(negocioId, {
                monto: 100,
                descripcion: "Gasto Test",
                empleadoId: empIdSinCaja
            });
            console.error("   ❌ ERROR: Se permitio registrar un gasto a un usuario sin caja abierta.");
        } catch (err) {
            console.log(`   ✅ CORRECTO: Registro rechazado con mensaje: "${err.message}" (Code: ${err.code})`);
        }

        console.log(`\n[TEST 4] Verificando consulta de todas las cajas abiertas del negocio (Administrador)`);
        const abiertas = await cajasService.obtenerCajasAbiertas(negocioId);
        console.log(`   ✅ Cajas abiertas activas en el negocio: ${abiertas.length}`);
        abiertas.forEach(c => {
            console.log(`      - Caja ID #${c.id} | Operador: ${c.usuario?.nombre} (ID: ${c.usuarioId}) | Efectivo Esperado: $${c.efectivoEsperadoEnVivo}`);
        });

        console.log("\n=== PRUEBA DE RESILIENCIA Y AISLAMIENTO FINALIZADA EXITOSAMENTE ===");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ ERROR EN LA AUDITORIA DE CAJAS:", err);
        process.exit(1);
    }
}

runTest();
