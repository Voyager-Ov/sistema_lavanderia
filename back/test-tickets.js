import dotenv from 'dotenv';
dotenv.config();
import { connectionManager } from './src/models/connectionManager.js';
import { obtenerPedidos, generarTicketHTML, generarFacturaElectronica } from './src/services/pedidos/pedido.service.js';

async function run() {
  try {
    await connectionManager.initCentral();
    const negocioId = 9; // El id de negocio usado en sesiones anteriores
    
    console.log("-----------------------------------------");
    console.log("1. Buscando un pedido para probar...");
    const pedidos = await obtenerPedidos(negocioId, { limit: 1, page: 1 });
    
    if (pedidos.items.length === 0) {
      console.log("No hay pedidos en la base de datos para probar.");
      process.exit(0);
    }
    
    const pedido = pedidos.items[0];
    console.log(`Pedido seleccionado: ID ${pedido.id} | Ticket: ${pedido.codigoSeguimiento}`);
    
    console.log("\n-----------------------------------------");
    console.log("2. Probando generación de TICKET HTML...");
    try {
      const html = await generarTicketHTML(negocioId, pedido.id);
      console.log("✅ Ticket generado con éxito. Longitud HTML:", html.length);
      console.log("Preview del HTML:");
      console.log(html.substring(0, 150) + "...");
    } catch (error) {
      console.error("❌ Error al generar Ticket:", error);
    }

    console.log("\n-----------------------------------------");
    console.log("3. Probando generación de FACTURA AFIP (Esperando error)...");
    try {
      const factura = await generarFacturaElectronica(negocioId, pedido.id);
      console.log("✅ Factura generada (Inesperado, parece que AFIP está configurado!):", factura);
    } catch (error) {
      console.error("✅ AFIP rechazó la solicitud correctamente (Comportamiento esperado en prueba local).");
      console.error("Detalle del Error Capturado:", error.message);
    }

    console.log("\n-----------------------------------------");
    console.log("Pruebas finalizadas.");
  } catch (error) {
    console.error("ERROR CRÍTICO:", error);
  } finally {
    process.exit(0);
  }
}

run();
