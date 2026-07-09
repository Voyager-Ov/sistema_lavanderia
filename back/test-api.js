import { connectionManager } from './src/models/connectionManager.js';
import * as dashboardService from './src/services/dashboard/dashboard.service.js';
import * as pedidoService from './src/services/pedidos/pedido.service.js';

async function test() {
    try {
        console.log("Conectando a BD...");
        await connectionManager.init();
        console.log("🟢 Conectado.");

        console.log("Probando Dashboard Stats para negocio 9...");
        try {
            const stats = await dashboardService.getDashboardStats(9);
            console.log("✅ Dashboard Stats Ok");
        } catch(err) {
            console.error("❌ ERROR DASHBOARD:", err.message);
        }

        console.log("Probando Pedidos para negocio 9...");
        try {
            const pedidos = await pedidoService.obtenerPedidos(9, { limit: 10, page: 1 });
            console.log("✅ Pedidos Ok. Total:", pedidos.meta.totalItems);
        } catch(err) {
            console.error("❌ ERROR PEDIDOS:", err.message);
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ FATAL ERROR:", err);
        process.exit(1);
    }
}
test();
