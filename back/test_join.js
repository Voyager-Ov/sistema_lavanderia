import "dotenv/config";
import { connectionManager } from "./src/models/connectionManager.js";

async function run() {
    await connectionManager.initCentral();
    const tenantContext = await connectionManager.getTenantDb(1);
    
    try {
        const pedidos = await tenantContext.models.Pedido.findAll({
            include: [{ model: tenantContext.models.Usuario, as: 'creador' }]
        });
        console.log("Pedidos:", JSON.stringify(pedidos, null, 2));
    } catch (e) {
        console.error(e);
    }
    
    // We actually want to query HistorialPedido since it has the association
    try {
        const hist = await tenantContext.models.HistorialPedido.findAll({
            include: [{ model: tenantContext.models.Usuario, as: 'usuario' }],
            logging: console.log
        });
        console.log("Historial:", JSON.stringify(hist, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
