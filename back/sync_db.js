import "dotenv/config";
import { connectionManager } from "./src/models/connectionManager.js";

async function run() {
    try {
        await connectionManager.initCentral();
        console.log("Sincronizando tenant_2...");
        const tenantDb = await connectionManager.getTenantDb(2, true); 
        await tenantDb.sequelize.sync({ alter: true });
        console.log("Tablas sincronizadas.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
