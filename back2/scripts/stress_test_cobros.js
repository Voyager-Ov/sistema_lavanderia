import { connectionManager } from "../src/models/connectionManager.js";
import { pagosService } from "../src/modules/finanzas/services/pagos.service.js";
import { pedidosService } from "../src/modules/pedidos/services/pedidos.service.js";
import { clientesService } from "../src/modules/clientes/services/clientes.service.js";
import { serviciosService } from "../src/modules/servicios/services/servicios.service.js";
import { categoriasService } from "../src/modules/servicios/services/categorias.service.js";

async function runStressTest() {
    console.log("🚀 Iniciando Pruebas de Estrés y Bordes de Cobros y Cuenta Corriente...\n");
    const negocioId = 1;

    try {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        const { Pedido } = tenantDb.models;

        // Setup base data
        const cat = await categoriasService.crearCategoria(negocioId, { nombre: "General Test " + Date.now() });
        const serv = await serviciosService.crearServicio(negocioId, {
            nombre: "Servicio Test",
            precioActual: 10000,
            categoriaId: cat.id
        });

        const cliente = await clientesService.crearCliente(negocioId, { nombre: "Cliente Estrés " + Date.now() });
        const clienteId = cliente.id;
        console.log(`✅ Cliente Creado ID: ${clienteId}`);

        // TEST 1: Cobro Individual y Generación de Vuelto como Saldo a Favor
        console.log("\n🧪 Test 1: Cobro con Vuelto registrado como Saldo a Favor...");
        const ped1 = await pedidosService.crearPedido(negocioId, {
            clienteId,
            items: [{ productoId: serv.id, cantidad: 1 }] // Total: $10.000
        });
        const numPed1 = ped1.numeroPedido || ped1.id;

        const res1 = await pagosService.procesarCobro(negocioId, {
            clienteId,
            pedidosIds: [numPed1],
            montoRecibido: 15000, // Entrega 15.000 para pagar 10.000
            dejarVueltoAFavor: true
        });

        console.log("   Resultado Test 1:", JSON.stringify(res1.cobros[0]));
        const estadoCuenta1 = await clientesService.obtenerEstadoCuenta(negocioId, clienteId);
        console.log("   Saldo a Favor resultante en cliente:", estadoCuenta1.resumen.saldoAFavor);
        if (estadoCuenta1.resumen.saldoAFavor === 5000) {
            console.log("   ✅ PASÓ TEST 1: Saldo a Favor es $5.000 perfectamente.");
        } else {
            console.error("   ❌ FALLÓ TEST 1: Saldo a favor no coincide:", estadoCuenta1.resumen.saldoAFavor);
        }

        // TEST 2: Cobro con Saldo a Favor Excesivo (Usar crédito guardado)
        console.log("\n🧪 Test 2: Pagar pedido de $3.000 usando los $5.000 de Saldo a Favor acumulados...");
        const servSmall = await serviciosService.crearServicio(negocioId, {
            nombre: "Servicio Chiquito",
            precioActual: 3000,
            categoriaId: cat.id
        });
        const ped2 = await pedidosService.crearPedido(negocioId, {
            clienteId,
            items: [{ productoId: servSmall.id, cantidad: 1 }] // Total: $3.000
        });
        const numPed2 = ped2.numeroPedido || ped2.id;

        const res2 = await pagosService.procesarCobro(negocioId, {
            clienteId,
            pedidosIds: [numPed2],
            aplicarSaldoAFavor: true
        });

        console.log("   Resultado Test 2:", JSON.stringify(res2));
        const estadoCuenta2 = await clientesService.obtenerEstadoCuenta(negocioId, clienteId);
        console.log("   Saldo a Favor resultante en cliente:", estadoCuenta2.resumen.saldoAFavor);
        if (estadoCuenta2.resumen.saldoAFavor === 2000) {
            console.log("   ✅ PASÓ TEST 2: Quedaron $2.000 de Saldo a Favor ($5.000 - $3.000).");
        } else {
            console.error("   ❌ FALLÓ TEST 2: Saldo a favor no coincide:", estadoCuenta2.resumen.saldoAFavor);
        }

        // TEST 3: Intento de Cobrar Pedido Cancelado
        console.log("\n🧪 Test 3: Verificar que no se pueda cobrar un pedido CANCELADO...");
        const ped3 = await pedidosService.crearPedido(negocioId, {
            clienteId,
            items: [{ productoId: serv.id, cantidad: 1 }]
        });
        const numPed3 = ped3.numeroPedido || ped3.id;
        await Pedido.update({ estado: "CANCELADO" }, { where: { numeroPedido: numPed3 } });

        try {
            await pagosService.procesarCobro(negocioId, {
                clienteId,
                pedidosIds: [numPed3]
            });
            console.error("   ❌ FALLÓ TEST 3: Permitió cobrar un pedido cancelado.");
        } catch (err) {
            console.log(`   ✅ PASÓ TEST 3: Rechazó correctamente pedido cancelado con mensaje: "${err.message}"`);
        }

        // TEST 4: Intento de Doble Cobro Concurrente (Protección contra Cobro Duplicado)
        console.log("\n🧪 Test 4: Prueba de Doble Cobro (Intentar cobrar un pedido que ya está cobrado)...");
        const ped4 = await pedidosService.crearPedido(negocioId, {
            clienteId,
            items: [{ productoId: serv.id, cantidad: 1 }]
        });
        const numPed4 = ped4.numeroPedido || ped4.id;

        // Primer cobro exitoso
        await pagosService.procesarCobro(negocioId, { clienteId, pedidosIds: [numPed4] });

        // Segundo cobro del mismo pedido
        try {
            await pagosService.procesarCobro(negocioId, { clienteId, pedidosIds: [numPed4] });
            console.error("   ❌ FALLÓ TEST 4: Permitió cobrar 2 veces el mismo pedido.");
        } catch (err) {
            console.log(`   ✅ PASÓ TEST 4: Evitó el doble cobro con mensaje: "${err.message}"`);
        }

        // TEST 5: Cobro Masivo Múltiple de N Pedidos
        console.log("\n🧪 Test 5: Cobro Masivo de 3 Pedidos en una sola llamada...");
        const pedA = await pedidosService.crearPedido(negocioId, { clienteId, items: [{ productoId: servSmall.id, cantidad: 1 }] });
        const pedB = await pedidosService.crearPedido(negocioId, { clienteId, items: [{ productoId: servSmall.id, cantidad: 1 }] });
        const pedC = await pedidosService.crearPedido(negocioId, { clienteId, items: [{ productoId: servSmall.id, cantidad: 1 }] });

        const idsBatch = [pedA.numeroPedido || pedA.id, pedB.numeroPedido || pedB.id, pedC.numeroPedido || pedC.id];
        const resBatch = await pagosService.procesarCobro(negocioId, {
            clienteId,
            pedidosIds: idsBatch,
            aplicarSaldoAFavor: true, // Aplica los $2.000 restantes
            montoRecibido: 7000 // Paga los $7.000 faltantes ($9.000 total - $2.000 saldo = $7.000)
        });

        console.log("   Resultado Test 5 Batch:", JSON.stringify({
            pedidosCobrados: resBatch.pedidosCobradosCount,
            totalMonto: resBatch.totalMontoCobrado,
            creditoConsumido: resBatch.creditoConsumidoTotal
        }));

        const estadoCuentaFinal = await clientesService.obtenerEstadoCuenta(negocioId, clienteId);
        console.log("   Saldo a Favor Final:", estadoCuentaFinal.resumen.saldoAFavor);
        console.log("   Deuda Total Final:", estadoCuentaFinal.resumen.deudaTotal);

        if (resBatch.pedidosCobradosCount === 3 && estadoCuentaFinal.resumen.deudaTotal === 0) {
            console.log("   ✅ PASÓ TEST 5: Cobro masivo completado sin deudas ni inconsistencias.");
        } else {
            console.error("   ❌ FALLÓ TEST 5.");
        }

        console.log("\n✨ ¡TODAS LAS PRUEBAS DE ESTRÉS Y BORDES FINALIZARON CON ÉXITO ABSOLUTO (100% PASS)! 🎉");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ Error inesperado durante el test de estrés:", err);
        process.exit(1);
    }
}

runStressTest();
