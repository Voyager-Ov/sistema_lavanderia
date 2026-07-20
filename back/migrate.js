import dotenv from 'dotenv';
dotenv.config();

import { connectionManager } from './src/models/connectionManager.js';
import { Sequelize } from 'sequelize';

async function runMigration() {
    try {
        console.log("Iniciando conexión a BD central...");
        await connectionManager.initCentral();
        
        const dbUrl = process.env.DATABASE_URL;
        const sequelize = new Sequelize(dbUrl, {
            dialect: "postgres",
            logging: false,
            dialectOptions: {
                ssl: { require: true, rejectUnauthorized: false }
            }
        });

        // Get all tenant schemas
        const schemas = await sequelize.query(
            "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%';",
            { type: Sequelize.QueryTypes.SELECT }
        );

        console.log(`Se encontraron ${schemas.length} esquemas de tenant.`);

        for (const schema of schemas) {
            const schemaName = schema.schema_name;
            const negocioId = parseInt(schemaName.split('_')[1], 10);
            
            console.log(`Migrando ${schemaName} (Negocio ID: ${negocioId})...`);
            
            const tenantContext = await connectionManager.getTenantDb(negocioId, true); // forceSync to create models
            
            // Forzamos el alter: true para que se creen las nuevas tablas y columnas
            await tenantContext.sequelize.sync({ alter: true });
            
            console.log(`Migración completada para ${schemaName}`);
        }

        console.log("Migración finalizada exitosamente.");
        process.exit(0);
    } catch (error) {
        console.error("Error durante la migración:", error);
        process.exit(1);
    }
}

runMigration();
