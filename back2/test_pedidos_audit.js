import dotenv from 'dotenv';
dotenv.config();
import { connectionManager } from './src/models/connectionManager.js';
import { loginService } from './src/modules/auth/services/login.service.js';
import { pedidosService } from './src/modules/pedidos/services/pedidos.service.js';
import { trazabilidadService } from './src/modules/pedidos/services/trazabilidad.service.js';
import { cancelacionService } from './src/modules/pedidos/services/cancelacion.service.js';
import { facturacionService } from './src/modules/pedidos/services/facturacion.service.js';
import { ticketService } from './src/modules/pedidos/services/ticket.service.js';
import { trackingService } from './src/modules/pedidos/services/tracking.service.js';

async function runPedidosAudit() {
    console.log("================================================================================");
    console.log("🛡️ INICIANDO AUDITORÍA CRUZADA Y PRUEBAS DE CASOS DE USO REALES: MÓDULO PEDIDOS");
    console.log("================================================================================");

    await connectionManager.initCentral();

    // 0. Resolución Dinámica de Tenant (CERO Hardcoding)
    console.log("\n0️⃣  [AUTH] Resolviendo tenant dinámicamente desde el usuario autenticado...");
    const { Usuario } = connectionManager.centralModels;
    const emailAudit = process.env.AUDIT_USER_EMAIL || "octavio.velo2022@gmail.com";

    const usuario = await Usuario.findOne({ where: { email: emailAudit } });
    if (!usuario) {
        throw new Error(`No se encontró el usuario ${emailAudit} en la base de datos central.`);
    }

    const { negocio, empleado } = await loginService._getEmpleadoYNegocioStrict(usuario);
    if (!negocio || !negocio.id) {
        throw new Error(`El usuario ${emailAudit} no tiene un negocio activo.`);
    }

    const negocioId = negocio.id;
    const empleadoId = empleado.id;
    console.log(`   ✅ Tenant resuelto dinámicamente: Negocio ID ${negocioId} ("${negocio.nombre}"), Empleado: "${empleado.nombre}" (ID: ${empleadoId})`);

    const tenantModels = await connectionManager.getTenantDb(negocioId);
    const { Servicio, Cliente, Pedido } = tenantModels.models;

    // Buscar o crear un servicio activo para las pruebas
    let servicioTest = await Servicio.findOne({ where: { activo: true, disponible: true } });
    if (!servicioTest) {
        servicioTest = await Servicio.create({
            nombre: "Servicio Test Pedidos " + Date.now(),
            precioActual: 2500,
            costoEstimado: 500,
            tiempoEstimadoMinutos: 45,
            disponible: true,
            activo: true,
            negocioId
        });
    }

    // Buscar o crear un cliente activo para las pruebas
    let clienteTest = await Cliente.findOne({ where: { activo: true } });
    if (!clienteTest) {
        clienteTest = await Cliente.create({
            nombre: "Cliente Auditoría " + Date.now(),
            telefono: "1122334455",
            email: "cliente_audit@example.com",
            activo: true,
            negocioId
        });
    }

    let pedidoCreadoId = null;

    try {
        // 1. FAIL-FAST: Creación de pedido SIN detalles/items
        console.log("\n1️⃣  [TEST FAIL-FAST] Creación de pedido con detalles vacíos...");
        try {
            await pedidosService.crearPedido(negocioId, {
                clienteId: clienteTest.id,
                detalles: []
            });
            console.error("   ❌ ERROR: Se esperaba MISSING_ORDER_ITEMS pero fue aceptado.");
            process.exit(1);
        } catch (err) {
            console.log(`   ✅ Rechazado correctamente: [${err.code || err.statusCode}] ${err.message}`);
        }

        // 2. FAIL-FAST: Creación de pedido SIN cliente (ni ID ni nombre)
        console.log("\n2️⃣  [TEST FAIL-FAST] Creación de pedido sin cliente...");
        try {
            await pedidosService.crearPedido(negocioId, {
                detalles: [{ servicioId: servicioTest.id, cantidad: 1 }]
            });
            console.error("   ❌ ERROR: Se esperaba MISSING_CLIENT pero fue aceptado.");
            process.exit(1);
        } catch (err) {
            console.log(`   ✅ Rechazado correctamente: [${err.code || err.statusCode}] ${err.message}`);
        }

        // 3. FAIL-FAST: Creación de pedido con servicioId inexistente
        console.log("\n3️⃣  [TEST FAIL-FAST] Creación de pedido con servicioId inexistente (999999)...");
        try {
            await pedidosService.crearPedido(negocioId, {
                clienteId: clienteTest.id,
                detalles: [{ servicioId: 999999, cantidad: 1 }]
            });
            console.error("   ❌ ERROR: Se esperaba SERVICE_NOT_FOUND.");
            process.exit(1);
        } catch (err) {
            console.log(`   ✅ Rechazado correctamente: [${err.code || err.statusCode}] ${err.message}`);
        }

        // 4. FAIL-FAST: Creación de pedido con cantidad inválida (0 o negativa)
        console.log("\n4️⃣  [TEST FAIL-FAST] Creación de pedido con cantidad = 0...");
        try {
            await pedidosService.crearPedido(negocioId, {
                clienteId: clienteTest.id,
                detalles: [{ servicioId: servicioTest.id, cantidad: 0 }]
            });
            console.error("   ❌ ERROR: Se esperaba INVALID_DATA.");
            process.exit(1);
        } catch (err) {
            console.log(`   ✅ Rechazado correctamente: [${err.code || err.statusCode}] ${err.message}`);
        }

        // 5. Creación legítima de Pedido con cálculo exacto
        console.log("\n5️⃣  [TEST] Creación legítima de Pedido con 2 unidades...");
        const nuevoPedido = await pedidosService.crearPedido(negocioId, {
            clienteId: clienteTest.id,
            origen: "MOSTRADOR",
            observaciones: "Prueba de auditoría de casos de uso",
            detalles: [
                { servicioId: servicioTest.id, cantidad: 2 }
            ]
        });

        pedidoCreadoId = nuevoPedido.numeroPedido;
        const totalEsperado = Number(servicioTest.precioActual) * 2;
        console.log(`   ✅ Pedido #${pedidoCreadoId} creado exitosamente.`);
        console.log(`      Total calculado: $${nuevoPedido.total} (Esperado: $${totalEsperado}), Estado: ${nuevoPedido.estado}`);
        
        if (Number(nuevoPedido.total) !== totalEsperado) {
            throw new Error(`Total inconsistente: se obtuvo ${nuevoPedido.total}, se esperaba ${totalEsperado}`);
        }

        // 6. Consultar pedido por ID
        console.log("\n6️⃣  [TEST] Consultar pedido por número...");
        const pedidoConsultado = await pedidosService.obtenerPedidoPorNumero(negocioId, pedidoCreadoId);
        console.log(`   ✅ Pedido obtenido. Cliente: "${pedidoConsultado.cliente?.nombre}", Detalles: ${pedidoConsultado.detalles?.length} ítems`);

        // 7. Transición de estado legítima: PENDIENTE -> EN_PROCESO -> LISTO_PARA_RETIRAR
        console.log("\n7️⃣  [TEST] Transición de estados de taller (PENDIENTE -> EN_PROCESO -> LISTO_PARA_RETIRAR)...");
        await trazabilidadService.cambiarEstado(negocioId, pedidoCreadoId, "EN_PROCESO");
        let pCheck = await pedidosService.obtenerPedidoPorNumero(negocioId, pedidoCreadoId);
        console.log(`   ✅ Transición 1: Estado actual = ${pCheck.estado}`);

        await trazabilidadService.cambiarEstado(negocioId, pedidoCreadoId, "LISTO_PARA_RETIRAR");
        pCheck = await pedidosService.obtenerPedidoPorNumero(negocioId, pedidoCreadoId);
        console.log(`   ✅ Transición 2: Estado actual = ${pCheck.estado}`);

        // 8. Generar factura electrónica mock
        console.log("\n8️⃣  [TEST] Generar comprobante/factura del pedido...");
        const factura = await facturacionService.generarFactura(negocioId, pedidoCreadoId);
        console.log(`   ✅ Factura generada. CAE: ${factura.cae}, Nro Comprobante: ${factura.nroComprobante}`);

        // 9. Generar tickets para prendas
        console.log("\n9️⃣  [TEST] Generar tickets para 2 prendas...");
        const tickets = await ticketService.generarTicketsPrenda(negocioId, pedidoCreadoId, 2);
        console.log(`   ✅ ${tickets.length} tickets de prendas generados.`);

        // 10. Obtener HTML del ticket de mostrador
        console.log("\n🔟 [TEST] Obtener ticket HTML para impresión térmica...");
        const ticketHTML = await ticketService.obtenerTicketHTML(negocioId, pedidoCreadoId);
        console.log(`   ✅ HTML de ticket generado correctamente (${ticketHTML.length} caracteres).`);

        // 11. Tracking público del pedido
        console.log("\n1️⃣1️⃣ [TEST] Obtener información de tracking público...");
        const tracking = await trackingService.obtenerTrackingPublico(negocioId, `LAV-${pedidoCreadoId}`);
        console.log(`   ✅ Tracking público verificado. Código: ${tracking.ticketCodigo}, Estado: ${tracking.estado}`);

        // 12. Cancelación con motivo y registro
        console.log("\n1️⃣2️⃣ [TEST] Cancelación del pedido con motivo estructurado...");
        await cancelacionService.cancelarPedido(negocioId, pedidoCreadoId, {
            motivoCancelacion: "Cliente solicitó anulación por viaje",
            descripcionCancelacion: "Auditoría de caso de uso de anulación",
            accionDinero: "NINGUNA",
            empleadoId
        });
        const pCancelado = await pedidosService.obtenerPedidoPorNumero(negocioId, pedidoCreadoId);
        console.log(`   ✅ Pedido #${pedidoCreadoId} cancelado. Estado: ${pCancelado.estado}`);

        // 13. FAIL-FAST: Transición de estado en pedido ya cancelado (debe fallar)
        console.log("\n1️⃣3️⃣ [TEST FAIL-FAST] Intentar cambiar estado de un pedido ya CANCELADO...");
        try {
            await trazabilidadService.cambiarEstado(negocioId, pedidoCreadoId, "EN_PROCESO");
            console.error("   ❌ ERROR: Se esperaba que la transición fuera rechazada.");
            process.exit(1);
        } catch (err) {
            console.log(`   ✅ Rechazado correctamente: [${err.code || err.statusCode}] ${err.message}`);
        }

        console.log("\n================================================================================");
        console.log("🎉 AUDITORÍA COMPLETA: TODOS LOS TESTS DE PEDIDOS PASARON EXITOSAMENTE");
        console.log("================================================================================\n");
        process.exit(0);

    } catch (fatalError) {
        console.error("\n❌ ERROR FATAL EN AUDITORÍA DE PEDIDOS:", fatalError);
        process.exit(1);
    }
}

runPedidosAudit();
