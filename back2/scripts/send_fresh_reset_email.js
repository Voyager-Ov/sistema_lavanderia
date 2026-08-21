import dotenv from "dotenv";
dotenv.config();

import { connectionManager } from "../src/models/connectionManager.js";
import { passwordService } from "../src/modules/auth/services/password.service.js";

async function sendFreshEmail() {
    console.log("🚀 Generando nuevo token de restablecimiento y enviando email...");
    await connectionManager.initCentral();

    await passwordService.forgotPassword("octavio.velo2022@gmail.com");

    const { Usuario } = connectionManager.centralModels;
    const usuario = await Usuario.findByPk("octavio.velo2022@gmail.com");

    console.log("\n✅ Nuevo Token activo en BD:", usuario.tokenConfirmacion);
    console.log(`🔗 Enlace directo: http://localhost:3000/reset-password?token=${usuario.tokenConfirmacion}&email=octavio.velo2022%40gmail.com\n`);
    process.exit(0);
}

sendFreshEmail().catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
});
