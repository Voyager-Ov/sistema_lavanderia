import { connectionManager } from "./src/models/connectionManager.js";
import dotenv from "dotenv";
dotenv.config();

const syncDB = async () => {
    console.log("Iniciando sync...");
    await connectionManager.initCentral();
    
    // Obtener todos los negocios
    const Negocio = connectionManager.centralModels.Negocio;
    const negocios = await Negocio.findAll();
    
    console.log(`Encontrados ${negocios.length} negocios. Sincronizando...`);
    
    for (const negocio of negocios) {
        console.log(`Sincronizando tenant ${negocio.id}...`);
        const tenantContext = await connectionManager.getTenantDb(negocio.id, false); 
        await tenantContext.sequelize.sync({ alter: true });
    }
    
    console.log("Todos los tenants sincronizados.");
    process.exit(0);
};

syncDB().catch(console.error);
