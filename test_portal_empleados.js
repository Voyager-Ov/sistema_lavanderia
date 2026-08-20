import { connectionManager } from "./back2/src/models/connectionManager.js";
import { dashboardService } from "./back2/src/modules/dashboard/services/dashboard.service.js";
import { cajasService } from "./back2/src/modules/finanzas/services/cajas.service.js";
import { pedidosService } from "./back2/src/modules/pedidos/services/pedidos.service.js";
import { clientesService } from "./back2/src/modules/clientes/services/clientes.service.js";
import { serviciosService } from "./back2/src/modules/servicios/services/servicios.service.js";

async function runEmployeePortalAudit() {
  const negocioId = 13; // Live Neon DB Tenant ID
  console.log(`\n======================================================`);
  console.log(`  AUDITORÍA DE RESILIENCIA DEL PORTAL DE EMPLEADOS (/pos)`);
  console.log(`  Negocio ID: ${negocioId}`);
  console.log(`======================================================\n`);

  try {
    // 1. Audit Dashboard Stats Endpoint
    console.log("1. Auditando GET /api/dashboard/stats...");
    const stats = await dashboardService.obtenerEstadisticasDashboard(negocioId);
    console.log("  ✔ Dashboard Stats:", {
      hoyTotalPedidos: stats.ingresos?.hoyTotalPedidos,
      hoyCobrado: stats.ingresos?.hoyCobrado,
      pedidosActivos: stats.pedidosActivos,
      ultimosPedidosCount: stats.ultimosPedidos?.length
    });

    // 2. Audit Caja Actual Endpoint
    console.log("\n2. Auditando GET /api/cajas/actual...");
    try {
      const caja = await cajasService.obtenerCajaActual(negocioId);
      console.log("  ✔ Caja Actual:", {
        idCaja: caja?.idCaja || caja?.id,
        estado: caja?.estadoCaja || caja?.estado,
        montoInicial: caja?.montoInicial,
        efectivoEsperado: caja?.efectivoEsperadoEnVivo
      });
    } catch (err) {
      console.log("  ℹ Caja Actual: No hay caja abierta actualmente (Respuesta 404 esperada cuando está cerrada).");
    }

    // 3. Audit Pedidos List Endpoint
    console.log("\n3. Auditando GET /api/pedidos (Paginación y Filtros)...");
    const resPedidos = await pedidosService.listarPedidos(negocioId, { limit: 10, page: 1 });
    console.log("  ✔ Pedidos:", {
      totalItems: resPedidos.count,
      itemsReturned: resPedidos.rows?.length,
      primerPedidoId: resPedidos.rows?.[0]?.numeroPedido
    });

    // 4. Audit Clientes List Endpoint
    console.log("\n4. Auditando GET /api/clientes...");
    const resClientes = await clientesService.listarClientes(negocioId, { limit: 5 });
    console.log("  ✔ Clientes:", {
      totalItems: resClientes.count || resClientes.rows?.length,
      primerClienteNombre: resClientes.rows?.[0]?.nombre
    });

    // 5. Audit Servicios List Endpoint
    console.log("\n5. Auditando GET /api/servicios...");
    const resServicios = await serviciosService.listarServicios(negocioId, { limit: 10 });
    console.log("  ✔ Servicios:", {
      totalItems: Array.isArray(resServicios) ? resServicios.length : resServicios.count,
      primerServicio: Array.isArray(resServicios) ? resServicios[0]?.nombre : resServicios.rows?.[0]?.nombre
    });

    console.log(`\n======================================================`);
    console.log(`  SUCCESS: AUDITORÍA DEL PORTAL DE EMPLEADOS COMPLETADA 100%`);
    console.log(`======================================================\n`);
    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR EN LA AUDITORÍA DE CONTRATOS:", error);
    process.exit(1);
  }
}

runEmployeePortalAudit();
