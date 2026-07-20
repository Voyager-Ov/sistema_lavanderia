import dotenv from 'dotenv';
dotenv.config();
import { connectionManager } from '../src/models/connectionManager.js';

async function alterGastoTenants() {
    try {
        console.log("Iniciando migración de gastos para todos los tenants...");
        await connectionManager.initCentral();
        
        const db = connectionManager.centralDb;
        const Negocio = connectionManager.centralModels.Negocio;
        
        const negocios = await Negocio.findAll();
        
        for (const negocio of negocios) {
            const schema = `tenant_${negocio.id}`;
            console.log(`\nProcesando schema: ${schema}...`);
            
            // 1. Agregar columna metodoPagoId
            try {
                await db.query(`ALTER TABLE "${schema}"."gastos" ADD COLUMN "metodoPagoId" INTEGER REFERENCES "${schema}"."metodos_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;`);
                console.log(`- Columna metodoPagoId añadida a ${schema}.gastos`);
            } catch (e) {
                console.log(`- Nota: metodoPagoId ya existía o error en ${schema}:`, e.message);
            }

            // 2. Cambiar categoria a VARCHAR
            try {
                await db.query(`ALTER TABLE "${schema}"."gastos" ALTER COLUMN "categoria" TYPE VARCHAR(255) USING "categoria"::VARCHAR;`);
                console.log(`- Columna categoria cambiada a VARCHAR en ${schema}.gastos`);
            } catch (e) {
                console.log(`- Nota: categoria ya era VARCHAR o error en ${schema}:`, e.message);
            }
        }

        console.log("\nMigración finalizada con éxito.");
        process.exit(0);
    } catch (error) {
        console.error("Error en la migración:", error);
        process.exit(1);
    }
}

alterGastoTenants();
