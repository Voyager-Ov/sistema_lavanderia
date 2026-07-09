import dotenv from 'dotenv';
dotenv.config();
import { connectionManager } from './src/models/connectionManager.js';
import { getDashboardStats } from './src/services/dashboard/dashboard.service.js';
import { obtenerPedidos } from './src/services/pedidos/pedido.service.js';

async function run() {
  try {
    await connectionManager.initCentral();
    const negocioId = 9; // Assuming the user is in negocio 9
    
    console.log("Fetching Pedidos...");
    const pedidos = await obtenerPedidos(negocioId, { limit: 10, page: 1 });
    console.log("Pedidos fetched:", pedidos.items.length);
    
    console.log("Fetching Stats...");
    const stats = await getDashboardStats(negocioId);
    console.log("Stats fetched. Ingresos:", stats.ingresos.hoyTotalPedidos);
    
    console.log("SUCCESS!");
  } catch (error) {
    console.error("ERROR:", error);
  } finally {
    process.exit(0);
  }
}

run();
