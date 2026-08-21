import dotenv from "dotenv";
dotenv.config();

import { connectionManager } from "../src/models/connectionManager.js";
import { passwordService } from "../src/modules/auth/services/password.service.js";

async function main() {
    console.log("🚀 Probando forgotPassword para octavio.velo22@gmail.com...");
    try {
        await connectionManager.initCentral();
        console.log("✅ BD Central conectada.");

        const res = await passwordService.forgotPassword("octavio.velo22@gmail.com");
        console.log("✅ Resultado:", JSON.stringify(res));
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR en forgotPassword:", err);
        process.exit(1);
    }
}

main();
