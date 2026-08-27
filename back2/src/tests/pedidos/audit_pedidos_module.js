import "dotenv/config";
import { connectionManager } from "../../models/connectionManager.js";
import { pedidosService } from "../../modules/pedidos/services/pedidos.service.js";
import { trazabilidadService } from "../../modules/pedidos/services/trazabilidad.service.js";
import { cancelacionService } from "../../modules/pedidos/services/cancelacion.service.js";
import { serviciosService } from "../../modules/servicios/services/servicios.service.js";
import { clientesService } from "../../modules/clientes/services/clientes.service.js";
import { AppError } from "../../utils/appError.js";

async function runPedidosAudit() {
    console.log("🚀 INICIANDO AUDITORÍA Y PRUEBAS EN VIVO DEL MÓDULO DE PEDIDOS...\n");

    console.log("[TEST 1] Inicializando conexión central de DB (Neon DB)...");
    await connectionManager.initCentral();
    const negocioId = 13; // Negocio activo de prueba
    console.log("✅ Conexión inicializada con éxito.\n");

    console.log("[TEST 2] Verificando Fail-Fast al omitir negocioId en pedidosService...");
    try {
        await pedidosService.listarPedidos(null);
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

    console.log("[TEST 3] Verificando Fail-Fast en crearPedido sin detalles...");
    try {
        await pedidosService.crearPedido(negocioId, { clienteId: 1, detalles: [] });
        console.error("❌ FALLO: Debería haber rechazado detalles vacíos.");
        process.exit(1);
    } catch (err) {
        if (err instanceof AppError && err.code === "MISSING_ORDER_ITEMS") {
            console.log("✅ Correcto: Lanzó AppError 400 (MISSING_ORDER_ITEMS).\n");
        } else {
            console.error("❌ FALLO: Lanzó error inesperado:", err);
            process.exit(1);
        }
    }

    console.log("[TEST 4] Obteniendo o creando un servicio de prueba para los detalles del pedido...");
    const tenantContext = await connectionManager.getTenantDb(negocioId);
    const { Servicio, Cliente } = tenantContext.models;

    let srv = await Servicio.findOne({ where: { negocioId } });
    if (!srv) {
        srv = await Servicio.create({
            nombre: "Lavado de prueba audit",
            precioActual: 1500,
            negocioId
        });
    }
    const servicioId = srv.id;
    const precioServicio = Number(srv.precioActual);
    console.log(`✅ Servicio de prueba ID: ${servicioId} (Precio: $${precioServicio}).\n`);

    console.log("[TEST 5] Obteniendo o creando un cliente de prueba...");
    let cli = await Cliente.findOne({ where: { negocioId } });
    if (!cli) {
        cli = await Cliente.create({
            nombre: "Cliente Audit Pedidos",
            telefono: "1199887766",
            negocioId
        });
    }
    const clienteId = cli.id;
    console.log(`✅ Cliente de prueba ID: ${clienteId}.\n`);

    console.log("[TEST 6] Creando un nuevo pedido atómicamente en Neon DB...");
    const nuevoPedido = await pedidosService.crearPedido(negocioId, {
        clienteId,
        origen: "MOSTRADOR",
        observaciones: "Pedido de auditoría en vivo",
        detalles: [
            { servicioId, cantidad: 2, precioUnitario: precioServicio }
        ]
    });

    const numeroPedido = nuevoPedido.numeroPedido || nuevoPedido.id;
    console.log(`✅ Pedido creado exitosamente #${numeroPedido} (Total: $${nuevoPedido.total}, Estado: ${nuevoPedido.estado}).\n`);

    console.log("[TEST 7] Recuperando pedido por número...");
    const pedidoRecuperado = await pedidosService.obtenerPedidoPorNumero(negocioId, numeroPedido);
    if (!pedidoRecuperado || pedidoRecuperado.detalles.length === 0) {
        console.error("❌ FALLO: No se pudo recuperar el pedido o sus detalles.");
        process.exit(1);
    }
    console.log(`✅ Pedido recuperado correctamente con ${pedidoRecuperado.detalles.length} detalle(s).\n`);

    console.log("[TEST 8] Ejecutando cambio de estado atómico a EN_PROCESO...");
    await trazabilidadService.cambiarEstado(negocioId, numeroPedido, "EN_PROCESO");
    const pedidoEnProceso = await pedidosService.obtenerPedidoPorNumero(negocioId, numeroPedido);
    if (pedidoEnProceso.estado !== "EN_PROCESO") {
        console.error(`❌ FALLO: El estado no cambió a EN_PROCESO (Actual: ${pedidoEnProceso.estado}).`);
        process.exit(1);
    }
    console.log("✅ Transición de estado a EN_PROCESO validada con éxito.\n");

    console.log("[TEST 9] Ejecutando cancelación atómica del pedido de prueba...");
    const cancelRes = await cancelacionService.cancelarPedido(negocioId, numeroPedido, {
        motivoCancelacion: "Prueba de auditoría",
        descripcionCancelacion: "Limpieza automática post-audit",
        empleadoId: 1
    });
    console.log(`✅ Pedido #${cancelRes.numeroPedido} cancelado exitosamente.\n`);

    console.log("[TEST 10] Verificando estado final CANCELADO en DB...");
    const pedidoCancelado = await pedidosService.obtenerPedidoPorNumero(negocioId, numeroPedido);
    if (pedidoCancelado.estado !== "CANCELADO") {
        console.error(`❌ FALLO: El estado final no es CANCELADO (Actual: ${pedidoCancelado.estado}).`);
        process.exit(1);
    }
    console.log("✅ Estado final CANCELADO verificado.\n");

    console.log("🎉 AUDITORÍA COMPLETA Y PRUEBAS DE INTEGRACIÓN DEL MÓDULO DE PEDIDOS EXITOSAS (100% PASS)!");
    process.exit(0);
}

runPedidosAudit().catch((err) => {
    console.error("💥 FALLO EN LA AUDITORÍA DE PEDIDOS:", err);
    process.exit(1);
});
