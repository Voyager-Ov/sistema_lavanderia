import dotenv from "dotenv";
dotenv.config();

import { emailService } from "../src/utils/email.util.js";

async function main() {
    console.log("🚀 Enviando email de restablecimiento de prueba a octavio.velo22@gmail.com...");
    await emailService.enviarRestablecimientoPassword("octavio.velo22@gmail.com", "token_demo_reset_live");
    console.log("✅ Proceso completado.");
    process.exit(0);
}

main();
