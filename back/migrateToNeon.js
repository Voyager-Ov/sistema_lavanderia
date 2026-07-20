import dotenv from 'dotenv';
dotenv.config();
import { connectionManager } from './src/models/connectionManager.js';

async function migrateAllToNeon() {
  try {
    console.log("Conectando a central...");
    await connectionManager.initCentral();
    console.log("✅ Central DB sincronizada");

    const negocios = await connectionManager.centralModels.Negocio.findAll();
    for (const negocio of negocios) {
      console.log(`⏳ Sincronizando tenant_${negocio.id}...`);
      const tenantContext = await connectionManager.getTenantDb(negocio.id, true); 
      
      try {
          await tenantContext.sequelize.sync({ alter: true });
          console.log(`✅ tenant_${negocio.id} sincronizado`);
      } catch (e) {
          console.error(`❌ Error sincronizando tenant_${negocio.id}:`, e.message);
      }
    }
    
    console.log("🎉 Migración a Neon completada.");
    process.exit(0);
  } catch (err) {
    console.error("Error en migración:", err);
    process.exit(1);
  }
}

migrateAllToNeon();
