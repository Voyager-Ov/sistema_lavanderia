import "dotenv/config";
import { connectionManager } from "./src/models/connectionManager.js";

async function migrateAllTenants() {
    process.env.NODE_ENV = "development";
    console.log("⚡ Migrando todos los esquemas de tenants en Neon PostgreSQL...");

    try {
        await connectionManager.initCentral();

        // Consultar todos los esquemas tenant en PostgreSQL
        const [schemas] = await connectionManager.centralDb.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name LIKE 'tenant_%';
        `);

        console.log(`🔍 Se encontraron ${schemas.length} esquemas de tenant:`, schemas.map(s => s.schema_name));

        for (const s of schemas) {
            const negocioId = parseInt(s.schema_name.replace("tenant_", ""));
            if (!isNaN(negocioId)) {
                console.log(`🔄 Migrando y alterando tablas para ${s.schema_name} (ID: ${negocioId})...`);
                await connectionManager.getTenantDb(negocioId, true);
            }
        }

        console.log("🎉 Todos los esquemas de tenants fueron migrados y alterados exitosamente con Neon PostgreSQL.");
        process.exit(0);
    } catch (error) {
        console.error("🔴 Error migrando esquemas:", error);
        process.exit(1);
    }
}

migrateAllTenants();
