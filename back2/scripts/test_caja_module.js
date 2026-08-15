import "dotenv/config";
import { connectionManager } from "../src/models/connectionManager.js";
import { cajasService } from "../src/modules/finanzas/services/cajas.service.js";
import { pagosService } from "../src/modules/finanzas/services/pagos.service.js";
import { gastosService } from "../src/modules/gastos/services/gastos.service.js";
import { pedidosService } from "../src/modules/pedidos/services/pedidos.service.js";
import { clientesService } from "../src/modules/clientes/services/clientes.service.js";
import { serviciosService } from "../src/modules/servicios/services/servicios.service.js";
import { categoriasService } from "../src/modules/servicios/services/categorias.service.js";

async function testCajaLifecycle() {
    console.log("🚀 INICIANDO INTEGRATION SUITE PARA EL MÓDULO DE CAJA Y ARQUEO DIARIO...\n");
    const negocioId = 13; // Negocio de pruebas en vivo (octavio.velo2022@gmail.com)

    try {
        delete process.env.NODE_ENV;
        await connectionManager.initCentral();
        console.log(`🟢 Conectado a Neon PostgreSQL (Negocio ID: ${negocioId})\n`);

        // -------------------------------------------------------------------------
        // TEST 1: Estado inicial de Caja
        // -------------------------------------------------------------------------
        console.log("📦 TEST 1: Consultando Caja Actual...");
        let cajaActual = await cajasService.obtenerCajaActual(negocioId);
        console.log(`   Estado Caja: ${cajaActual.estado} | Monto Inicial: $${cajaActual.montoInicial} | Efectivo Esperado: $${cajaActual.efectivoEsperadoEnVivo}`);
        console.log("   ✅ PASÓ TEST 1: Obtención de estado de caja exitoso.");

        // Si estaba abierta, la cerramos para probar el ciclo de apertura fresco
        if (cajaActual.estado === "ABIERTA") {
            console.log("\n🧹 Cerrando turno anterior para iniciar prueba de ciclo completo...");
            await cajasService.cerrarCaja(negocioId, cajaActual.idCaja, { efectivoReal: cajaActual.efectivoEsperadoEnVivo });
        }

        // -------------------------------------------------------------------------
        // TEST 2: Apertura de Turno de Caja con $5.000 Iniciales
        // -------------------------------------------------------------------------
        console.log("\n🔓 TEST 2: Abriendo nuevo turno de caja con $5.000 de fondo...");
        const nuevaCaja = await cajasService.abrirCaja(negocioId, {
            montoInicial: 5000,
            observaciones: "Apertura de turno de prueba automática"
        });

        console.log(`   ID Caja: ${nuevaCaja.idCaja} | Estado: ${nuevaCaja.estado} | Fondo Inicial: $${nuevaCaja.montoInicial}`);

        if (nuevaCaja.estado === "ABIERTA" && nuevaCaja.montoInicial === 5000) {
            console.log("   ✅ PASÓ TEST 2: Caja abierta correctamente con fondo inicial.");
        } else {
            throw new Error("TEST 2 FALLÓ: La caja no se abrió con el monto inicial correcto.");
        }

        // -------------------------------------------------------------------------
        // TEST 3: Registro de Cobro en Efectivo e Ingreso Automático a Caja
        // -------------------------------------------------------------------------
        console.log("\n💵 TEST 3: Creando y cobrando pedido en efectivo...");
        
        // Crear cliente y pedido de prueba
        const cliente = await clientesService.crearCliente(negocioId, {
            nombre: "Test Caja " + Date.now(),
            telefono: "1199887766"
        });

        const cat = await categoriasService.crearCategoria(negocioId, { nombre: "Cat Caja " + Date.now() });
        const serv = await serviciosService.crearServicio(negocioId, {
            nombre: "Lavado Secado Rápido",
            precioActual: 8000,
            categoriaId: cat.id
        });

        const pedido = await pedidosService.crearPedido(negocioId, {
            clienteId: cliente.id,
            items: [{ servicioId: serv.id, cantidad: 1 }]
        });

        // Cobrar pedido en efectivo
        const cobro = await pagosService.procesarCobro(negocioId, {
            pedidosIds: [pedido.numeroPedido],
            clienteId: cliente.id,
            montoRecibido: 8000
        });

        console.log(`   Pedido #${pedido.numeroPedido} cobrado por $8.000.`);

        // -------------------------------------------------------------------------
        // TEST 4: Registro de Egreso por Gasto en Caja
        // -------------------------------------------------------------------------
        console.log("\n💸 TEST 4: Registrando un egreso de caja por compra de insumos ($2.000)...");
        const gasto = await gastosService.registrarGasto(negocioId, {
            monto: 2000,
            categoria: "Insumos Lavandería",
            descripcion: "Compra de detergente y suavizante"
        });

        console.log(`   Gasto registrado ID #${gasto.id} por $2.000.`);

        // -------------------------------------------------------------------------
        // TEST 5: Verificación de Totales y Arqueo en Vivo
        // -------------------------------------------------------------------------
        console.log("\n📊 TEST 5: Verificando métricas y arqueo de caja en vivo...");
        cajaActual = await cajasService.obtenerCajaActual(negocioId);

        console.log(`   Monto Inicial: $${cajaActual.montoInicial}`);
        console.log(`   Total Ingresos en Efectivo: $${cajaActual.totalIngresosEfectivo}`);
        console.log(`   Total Egresos en Efectivo: $${cajaActual.totalEgresosEnVivo}`);
        console.log(`   Efectivo Esperado en Vivo: $${cajaActual.efectivoEsperadoEnVivo} (Esperado: $11.000 = $5000 + $8000 - $2000)`);
        console.log(`   Cantidad de Pagos: ${cajaActual.pagos.length} | Cantidad de Gastos: ${cajaActual.gastos.length}`);

        if (cajaActual.efectivoEsperadoEnVivo === 11000) {
            console.log("   ✅ PASÓ TEST 5: El cálculo de efectivo esperado en caja es 100% exacto ($11.000).");
        } else {
            throw new Error(`TEST 5 FALLÓ: El efectivo esperado se calculó como $${cajaActual.efectivoEsperadoEnVivo} en lugar de $11.000.`);
        }

        // -------------------------------------------------------------------------
        // TEST 6: Cierre de Turno de Caja con Arqueo Real
        // -------------------------------------------------------------------------
        console.log("\n🔒 TEST 6: Cerrando el turno de caja con arqueo contado de $11.000...");
        const cajaCerrada = await cajasService.cerrarCaja(negocioId, cajaActual.idCaja, {
            efectivoReal: 11000,
            observaciones: "Cierre de turno de prueba sin diferencias"
        });

        console.log(`   Estado Cierre: ${cajaCerrada.estado} | Efectivo Real: $${cajaCerrada.efectivoReal}`);

        if (cajaCerrada.estado === "CERRADA" && cajaCerrada.efectivoReal === 11000) {
            console.log("   ✅ PASÓ TEST 6: Caja cerrada correctamente con arqueo verificado.");
        } else {
            throw new Error("TEST 6 FALLÓ en el cierre de caja.");
        }

        // -------------------------------------------------------------------------
        // TEST 7: Historial de Cajas
        // -------------------------------------------------------------------------
        console.log("\n📜 TEST 7: Consultando Historial de Turnos de Caja...");
        const historial = await cajasService.obtenerHistorialCajas(negocioId, { limit: 5 });

        console.log(`   Total de Cajas en Historial: ${historial.total} | Retornadas: ${historial.items.length}`);

        if (historial.items.length > 0 && historial.items[0].idCaja === cajaCerrada.idCaja) {
            console.log("   ✅ PASÓ TEST 7: La caja recién cerrada encabeza el historial correctamente.");
        } else {
            throw new Error("TEST 7 FALLÓ el ordenamiento del historial.");
        }

        console.log("\n==========================================================================================");
        console.log("🏆 ¡EL MÓDULO DE CAJA Y ARQUEO DIARIO HA PASADO TODAS LAS PRUEBAS AL 100% PERFECTO! 🏆");
        console.log("==========================================================================================\n");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ Error durante las pruebas del módulo de caja:", err);
        process.exit(1);
    }
}

testCajaLifecycle();
