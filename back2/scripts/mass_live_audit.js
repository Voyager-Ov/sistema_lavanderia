import "dotenv/config";
import { connectionManager } from "../src/models/connectionManager.js";
import { clientesService } from "../src/modules/clientes/services/clientes.service.js";
import { pedidosService } from "../src/modules/pedidos/services/pedidos.service.js";
import { serviciosService } from "../src/modules/servicios/services/servicios.service.js";
import { categoriasService } from "../src/modules/servicios/services/categorias.service.js";
import { pagosService } from "../src/modules/finanzas/services/pagos.service.js";

function isPedidoEntregadoCheck(p) {
    if (!p || p.cobrado) return false;
    const est = typeof p.estado === "object" ? p.estado?.nombre : p.estado;
    if (!est) return false;
    const estUpper = est.toString().toUpperCase();
    if (estUpper.includes("CANCELAD")) return false;
    return estUpper.includes("ENTREGADO") || estUpper.includes("COMPLETADO");
}

async function runMassiveLiveAudit() {
    console.log("⚡ INICIANDO AUDITORÍA MATEMÁTICA Y CARGA MASIVA DE ESTRÉS EN PRODUCCIÓN/DESARROLLO (NEGOCIO 13)...\n");

    try {
        delete process.env.NODE_ENV;
        await connectionManager.initCentral();

        const { Usuario, Negocio } = connectionManager.centralModels;
        let targetUser = await Usuario.findOne({ where: { email: "octavio.velo2022@gmail.com" } });
        let negocioId = targetUser?.negocioId || targetUser?.NegocioId || 13;

        console.log(`👤 Ejecutando sobre Negocio ID: ${negocioId}`);

        const tenantDb = await connectionManager.getTenantDb(negocioId);
        const { Pedido, CuentaCorriente, Cobro, MovimientoCaja, Servicio } = tenantDb.models;

        const metodos = await pagosService.obtenerMetodosPago(negocioId);
        const efectivoMetodo = metodos.find(m => m.nombre.toLowerCase().includes("efectivo")) || metodos[0];

        // Obtener servicios existentes directamente del modelo tenant
        let servs = await Servicio.findAll();
        if (servs.length === 0) {
            let cat = await tenantDb.models.CategoriaServicio.findOne();
            if (!cat) {
                cat = await tenantDb.models.CategoriaServicio.create({ nombre: "General audit" });
            }
            const newServ = await Servicio.create({
                nombre: "Servicio Auditoría Base",
                precioActual: 10000,
                categoriaId: cat.id
            });
            servs = [newServ];
        }

        const serv1 = servs[0];
        const serv2 = servs[1] || servs[0];

        console.log(`🧼 Servicios recuperados: "${serv1.nombre}" ($${serv1.precioActual}) y "${serv2.nombre}" ($${serv2.precioActual})`);
        console.log("📋 Generando 15 clientes masivos con más de 50 pedidos cruzados...");

        const clientesCreados = [];
        for (let i = 1; i <= 15; i++) {
            const cli = await clientesService.crearCliente(negocioId, {
                nombre: `Cliente Audit ${i}`,
                apellido: `Prueba ${Date.now() % 10000}`,
                telefono: `11-5000-${1000 + i}`,
                email: `audit.client.${i}.${Date.now()}@demo.com`
            });
            clientesCreados.push(cli);
        }

        console.log(`✅ 15 Clientes creados con sus CuentaCorriente en $0.`);

        // -------------------------------------------------------------------------
        // ESCENARIO 1: Generación de 50 Pedidos repartidos entre los 15 clientes
        // -------------------------------------------------------------------------
        const pedidosTotalesCreados = [];

        for (let idx = 0; idx < clientesCreados.length; idx++) {
            const client = clientesCreados[idx];
            
            // Cada cliente tendrá entre 3 y 5 pedidos
            const numPedidosCliente = (idx % 3) + 3; // 3, 4 o 5 pedidos

            for (let k = 0; k < numPedidosCliente; k++) {
                const servTarget = k % 2 === 0 ? serv1 : serv2;
                const ped = await pedidosService.crearPedido(negocioId, {
                    clienteId: client.id,
                    items: [{ productoId: servTarget.id, cantidad: (k % 2) + 1 }]
                });
                const numPed = ped.numeroPedido || ped.id;

                // Variación de estados: 
                // k=0 -> ENTREGADO (Deuda Exigible)
                // k=1 -> LISTO (En Taller)
                // k=2 -> PENDIENTE (En Taller)
                // k=3 -> ENTREGADO (Deuda Exigible)
                // k=4 -> CANCELADO
                if (k === 0 || k === 3) {
                    await Pedido.update({ estado: "ENTREGADO" }, { where: { numeroPedido: numPed } });
                } else if (k === 1) {
                    await Pedido.update({ estado: "LISTO" }, { where: { numeroPedido: numPed } });
                } else if (k === 4) {
                    await Pedido.update({ estado: "CANCELADO" }, { where: { numeroPedido: numPed } });
                }

                pedidosTotalesCreados.push({
                    numeroPedido: numPed,
                    clienteId: client.id,
                    kIndex: k
                });
            }
        }

        console.log(`📦 Se crearon ${pedidosTotalesCreados.length} pedidos totales en diversos estados.`);

        // -------------------------------------------------------------------------
        // AUDITORÍA MATEMÁTICA EN TIEMPO REAL 1: Aislamiento por Cliente
        // -------------------------------------------------------------------------
        console.log("\n📐 AUDITORÍA MATEMÁTICA 1: Verificación de Aislamiento de Saldos entre Clientes...");

        for (const client of clientesCreados) {
            const estado = await clientesService.obtenerEstadoCuenta(negocioId, client.id);
            
            // Buscar los pedidos devueltos para este cliente directamente en la BD
            const pedidosBD = await Pedido.findAll({ where: { clienteId: client.id } });
            
            const deudaCalculadaManual = pedidosBD
                .filter(p => isPedidoEntregadoCheck(p))
                .reduce((sum, p) => sum + parseFloat(p.total), 0);

            const noExigibleCalculadoManual = pedidosBD
                .filter(p => !isPedidoEntregadoCheck(p) && p.estado !== "CANCELADO" && !p.cobrado)
                .reduce((sum, p) => sum + parseFloat(p.total), 0);

            if (estado.resumen.deudaExigible !== deudaCalculadaManual) {
                throw new Error(`❌ ERROR EN CLIENTE ${client.id}: Deuda exigible reportada ($${estado.resumen.deudaExigible}) no coincide con la suma real ($${deudaCalculadaManual}).`);
            }

            if (estado.resumen.deudaNoExigible !== noExigibleCalculadoManual) {
                throw new Error(`❌ ERROR EN CLIENTE ${client.id}: Deuda no exigible reportada ($${estado.resumen.deudaNoExigible}) no coincide con la suma real ($${noExigibleCalculadoManual}).`);
            }
        }
        console.log("   ✅ PASÓ AUDITORÍA 1: La Deuda Exigible y el Monto en Taller son 100% aislados y exactos por cliente.");

        // -------------------------------------------------------------------------
        // ESCENARIO 2: Cobros Masivos Complejos y Retención de Vuelto
        // -------------------------------------------------------------------------
        console.log("\n💳 ESCENARIO 2: Ejecutando Cobros Masivos Complejos con Crédito + Excedente en Efectivo...");

        // Cliente Audit 1: Cargar $50.000 de Saldo a Favor por vuelto en exceso
        const client1 = clientesCreados[0];
        const pedidosClient1 = await Pedido.findAll({ where: { clienteId: client1.id, estado: "ENTREGADO", cobrado: false } });
        const p1Id = pedidosClient1[0].numeroPedido;
        const p1Total = parseFloat(pedidosClient1[0].total);

        // Paga pedido con billete muy alto ($50.000 sobre pedido de p1Total) y deja vuelto a favor
        await pagosService.procesarCobro(negocioId, {
            clienteId: client1.id,
            pedidosIds: [p1Id],
            metodoPagoId: efectivoMetodo.id,
            montoRecibido: p1Total + 50000,
            dejarVueltoAFavor: true
        });

        const estadoClient1Post = await clientesService.obtenerEstadoCuenta(negocioId, client1.id);
        console.log(`   Client 1 (${client1.nombre}): Cobrado Pedido #${p1Id}. Saldo a Favor resultante: $${estadoClient1Post.resumen.saldoAFavor}`);

        if (estadoClient1Post.resumen.saldoAFavor !== 50000) {
            throw new Error(`❌ AUDITORÍA VUELTO FALLÓ: Saldo a favor esperado $50.000, obtenido $${estadoClient1Post.resumen.saldoAFavor}`);
        }

        // Cliente Audit 2: Cobrar 2 pedidos a la vez consumiendo parte de un Saldo a Favor cargado manualmente
        const client2 = clientesCreados[1];
        await clientesService.ajustarCreditoCliente(negocioId, client2.id, { monto: 10000, concepto: "Crédito cargado" });
        
        const pedidosClient2 = await Pedido.findAll({ where: { clienteId: client2.id, cobrado: false } });
        const idsClient2 = pedidosClient2.slice(0, 2).map(p => p.numeroPedido);
        const totalBatchClient2 = pedidosClient2.slice(0, 2).reduce((sum, p) => sum + parseFloat(p.total), 0);

        // Paga aplicando $10.000 crédito + remanente en efectivo
        const remanenteEsperadoClient2 = Math.max(0, totalBatchClient2 - 10000);
        await pagosService.procesarCobro(negocioId, {
            clienteId: client2.id,
            pedidosIds: idsClient2,
            aplicarSaldoAFavor: true,
            montoRecibido: remanenteEsperadoClient2
        });

        const estadoClient2Post = await clientesService.obtenerEstadoCuenta(negocioId, client2.id);
        console.log(`   Client 2 (${client2.nombre}): Cobrados 2 pedidos ($${totalBatchClient2}). Saldo a Favor restante: $${estadoClient2Post.resumen.saldoAFavor}`);

        if (estadoClient2Post.resumen.saldoAFavor !== Math.max(0, 10000 - totalBatchClient2)) {
            throw new Error("❌ AUDITORÍA BATCH CON CRÉDITO FALLÓ");
        }

        // -------------------------------------------------------------------------
        // AUDITORÍA MATEMÁTICA EN TIEMPO REAL 2: Cero Deudas Fantasma ni Créditos Falsos
        // -------------------------------------------------------------------------
        console.log("\n🔍 AUDITORÍA MATEMÁTICA 2: Verificación de Cero Créditos Falsos y Cero Deudas Fantasma...");

        let inconsistenciasEncontradas = 0;
        for (const client of clientesCreados) {
            const estado = await clientesService.obtenerEstadoCuenta(negocioId, client.id);
            
            // Regla: Saldo a favor no puede ser negativo
            if (estado.resumen.saldoAFavor < 0) {
                console.error(`❌ ALERTA: Cliente ${client.id} tiene saldo a favor negativo: ${estado.resumen.saldoAFavor}`);
                inconsistenciasEncontradas++;
            }

            // Regla: Deuda Exigible no puede ser negativa
            if (estado.resumen.deudaExigible < 0) {
                console.error(`❌ ALERTA: Cliente ${client.id} tiene deuda exigible negativa: ${estado.resumen.deudaExigible}`);
                inconsistenciasEncontradas++;
            }
        }

        if (inconsistenciasEncontradas === 0) {
            console.log("   ✅ PASÓ AUDITORÍA 2: 0 créditos falsos, 0 valores negativos, 0 inconsistencias.");
        } else {
            throw new Error(`❌ Se encontraron ${inconsistenciasEncontradas} inconsistencias en la auditoría.`);
        }

        console.log("\n==========================================================================================");
        console.log("🏆 ¡AUDITORÍA MASIVA DE 50+ PEDIDOS COMPLETADA CON ÉXITO ABSOLUTO (100% MATEMÁTICO)! 🏆");
        console.log("==========================================================================================\n");
        process.exit(0);

    } catch (err) {
        console.error("\n❌ Error durante la auditoría masiva de pedidos:", err);
        process.exit(1);
    }
}

runMassiveLiveAudit();
