import dotenv from 'dotenv';
dotenv.config();
import { connectionManager } from '../src/models/connectionManager.js';

async function run() {
    try {
        await connectionManager.initCentral();
        const Usuario = connectionManager.centralModels.Usuario;
        
        const user = await Usuario.findOne({ where: { email: 'octavio.velo2022@gmail.com' } });
        if (user) {
            user.email = 'octaviovelo2022@gmail.com';
            await user.save();
            console.log("Email actualizado a octaviovelo2022@gmail.com");
        } else {
            console.log("No se encontró el usuario con el punto. Buscando sin el punto...");
            const user2 = await Usuario.findOne({ where: { email: 'octaviovelo2022@gmail.com' } });
            if (user2) {
                console.log("El usuario ya está guardado sin punto.");
            } else {
                console.log("No se encontró ningún usuario.");
            }
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

run();
