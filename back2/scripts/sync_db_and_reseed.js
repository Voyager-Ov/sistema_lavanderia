import "dotenv/config";
import { connectionManager } from "../src/models/connectionManager.js";
import { cajasService } from "../src/modules/finanzas/services/cajas.service.js";
import { pagosService } from "../src/modules/finanzas/services/pagos.service.js";
import { gastosService } from "../src/modules/gastos/services/gastos.service.js";
import { pedidosService } from "../src/modules/pedidos/services/pedidos.service.js";
import { clientesService } from "../src/modules/clientes/services/clientes.service.js";
import { serviciosService } from "../src/modules/servicios/services/servicios.service.js";
import { categoriasService } from "../src/modules/servicios/services/categorias.service.js";

async function runSyncAndReseed() {
    console.log("🚀 INICIANDO MIGRACIÓN Y SYNC LIMPIO EN NEON POSTGRESQL (NEGOCIO 13)...\n");
    const negocioId = 13;

    try {
        delete process.env.NODE_ENV;
        await connectionManager.initCentral();
        
        // Obtener tenant DB con forceSync = true para ejecutar alter y auto-migración
        const tenantContext = await connectionManager.getTenantDb(negocioId, true);
        const { MetodoPago } = tenantContext.models;

        console.log("🟢 Esquema tenant_13 sincronizado con columna metodoPagoId en movimientos_caja.\n");

        // 1. Asegurar Método Fijo Efectivo
        const [efectivo] = await MetodoPago.findOrCreate({
            where: { esFijo: true },
            defaults: {
                nombre: "Efectivo",
                icono: "Banknote",
                activo: true,
                esFijo: true,
                requiereIntegracion: false,
                negocioId
            }
        });

        // 2. Crear Método Personalizado Dinámico (Transferencia Banco Galicia)
        const [transferencia] = await MetodoPago.findOrCreate({
            where: { nombre: "Transferencia Banco Galicia" },
            defaults: {
                nombre: "Transferencia Banco Galicia",
                icono: "Landmark",
                activo: true,
                esFijo: false,
                requiereIntegracion: false,
                negocioId
            }
        });

        console.log(`💳 Métodos de Pago Disponibles: "${efectivo.nombre}" (Fijo) | "${transferencia.nombre}" (Dinámico)\n`);

        // 3. Ejecutar Ciclo de Prueba con Métodos Cruzados
        console.log("📦 TEST: Consultando Caja Actual...");
        let cajaActual = await cajasService.obtenerCajaActual(negocioId);

        if (cajaActual.estado === "ABIERTA") {
            console.log("🧹 Cerrando turno anterior...");
            await cajasService.cerrarCaja(negocioId, cajaActual.idCaja, { efectivoReal: cajaActual.efectivoEsperadoEnVivo });
        }

        console.log("\n🔓 Abriendo nuevo turno de caja con $10.000 iniciales...");
        const nuevaCaja = await cajasService.abrirCaja(negocioId, {
            montoInicial: 10000,
            observaciones: "Apertura de turno con métodos de pago dinámicos"
        });

        // Crear Cliente y Servicios
        const cliente = await clientesService.crearCliente(negocioId, {
            nombre: "Cliente Dinámico " + Date.now(),
            telefono: "1122334455"
        });

        const cat = await categoriasService.crearCategoria(negocioId, { nombre: "Cat Test " + Date.now() });
        const servA = await serviciosService.crearServicio(negocioId, { nombre: "Lavado Premium", precioActual: 5000, categoriaId: cat.id });
        const servB = await serviciosService.crearServicio(negocioId, { nombre: "Planchado Especial", precioActual: 15000, categoriaId: cat.id });

        // Pedido A: Cobrado en EFECTIVO ($5.000)
        console.log("\n💵 Cobrando Pedido A ($5.000) en EFECTIVO...");
        const pedA = await pedidosService.crearPedido(negocioId, { clienteId: cliente.id, items: [{ servicioId: servA.id, cantidad: 1 }] });
        await pagosService.procesarCobro(negocioId, {
            pedidosIds: [pedA.numeroPedido],
            clienteId: cliente.id,
            montoRecibido: 5000,
            metodoPagoId: efectivo.id
        });

        // Pedido B: Cobrado con TRANSFERENCIA BANCO GALICIA ($15.000)
        console.log("💳 Cobrando Pedido B ($15.000) con TRANSFERENCIA BANCO GALICIA...");
        const pedB = await pedidosService.crearPedido(negocioId, { clienteId: cliente.id, items: [{ servicioId: servB.id, cantidad: 1 }] });
        await pagosService.procesarCobro(negocioId, {
            pedidosIds: [pedB.numeroPedido],
            clienteId: cliente.id,
            montoRecibido: 15000,
            metodoPagoId: transferencia.id
        });

        // Registrar un Gasto en Efectivo de $2.000
        console.log("💸 Registrando un Gasto de Insumos ($2.000) en EFECTIVO...");
        await gastosService.registrarGasto(negocioId, {
            monto: 2000,
            categoria: "Insumos",
            descripcion: "Jabón líquido",
            metodoPagoId: efectivo.id
        });

        // Audit final de caja
        console.log("\n📊 AUDITORÍA FINAL DE CAJA:");
        cajaActual = await cajasService.obtenerCajaActual(negocioId);
        console.log(`   - Monto Inicial: $${cajaActual.montoInicial}`);
        console.log(`   - Ingresos Efectivo: $${cajaActual.totalIngresosEfectivo} (Esperado: $5.000)`);
        console.log(`   - Ingresos Digitales: $${cajaActual.totalIngresosDigitales} (Esperado: $15.000)`);
        console.log(`   - Egresos Efectivo: $${cajaActual.totalEgresosEnVivo} (Esperado: $2.000)`);
        console.log(`   - Efectivo Esperado en Vivo (Físico): $${cajaActual.efectivoEsperadoEnVivo} (Esperado: $13.000 = $10.000 + $5.000 - $2.000)`);
        console.log(`   - Desglose por Método:`, JSON.stringify(cajaActual.totalesPorMetodo, null, 2));

        if (cajaActual.efectivoEsperadoEnVivo === 13000 && cajaActual.totalIngresosDigitales === 15000) {
            console.log("\n  ✅ ¡LA MIGRACIÓN Y LA CLASIFICACIÓN DE MÉTODOS DE PAGO ES 100% CORRECTA Y EXACTA!");
        } else {
            throw new Error("Mismatch en la matemática de dinero en efectivo o digital.");
        }

        console.log("\n🔒 Cerrando turno de caja...");
        await cajasService.cerrarCaja(negocioId, cajaActual.idCaja, { efectivoReal: 13000 });

        console.log("\n==========================================================================================");
        console.log("🏆 ¡PROCESO DE MIGRACIÓN, SYNC Y RESEED COMPLETADO AL 100% EXITOSO! 🏆");
        console.log("==========================================================================================\n");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ Error en migración y reseed:", err);
        process.exit(1);
    }
}

runSyncAndReseed();
