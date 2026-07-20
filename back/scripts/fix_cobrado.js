import dotenv from 'dotenv';
dotenv.config();
import { connectionManager } from '../src/models/connectionManager.js';

async function run() {
    try {
        await connectionManager.initCentral();
        // user's negocioId is 2 based on previous seed
        const negocioId = 2;
        const {els, models: tenantModels} = await connectionManager.getTenantDb(negocioId, true);
        
        const pedido = await tenantModels.Pedido.findOne({ where: { codigoSeguimiento: 'LAV-1001' } });
        if (pedido) {
            pedido.cobrado = true;
            await pedido.save();
            console.log("Pedido LAV-1001 actualizado a cobrado=true");
        }
    } catch (error) {
        console.error("Error:", error);
    }
    process.exit(0);
}

run();
