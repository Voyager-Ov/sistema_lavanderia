import 'dotenv/config';
import { connectionManager } from './src/models/connectionManager.js';

async function checkDB() {
    try {
        await connectionManager.initCentral();
        const { Usuario } = connectionManager.centralModels;
        
        const usuarios = await Usuario.findAll({
            attributes: ['id', 'email', 'nombre', 'googleId', 'activo']
        });
        
        console.log("=== USUARIOS EN NEON ===");
        console.log(JSON.stringify(usuarios, null, 2));
        console.log("=========================");
        
        process.exit(0);
    } catch (e) {
        console.error("Error querying DB:", e);
        process.exit(1);
    }
}

checkDB();
