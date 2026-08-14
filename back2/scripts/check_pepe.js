import "dotenv/config";
import { connectionManager } from "../src/models/connectionManager.js";
import { authService } from "../src/modules/auth/services/auth.service.js";

async function checkUser() {
    await connectionManager.initCentral();
    const { Usuario } = connectionManager.centralModels;
    
    const email = "pepepelotudo4@gmail.com";
    const user = await Usuario.findByPk(email);
    
    console.log("=== USUARIO EN CONSOLA BACK2 DB ===");
    if (!user) {
        console.log("❌ Usuario NO encontrado en DB central");
    } else {
        const raw = user.toJSON();
        console.log({
            email: raw.email,
            emailConfirmado: raw.emailConfirmado,
            emailVerificado: raw.emailVerificado,
            tokenConfirmacion: raw.tokenConfirmacion,
            activo: raw.activo,
            password: raw.password ? "PRESENTE" : "NULL",
            passwordHash: raw.passwordHash ? "PRESENTE" : "NULL"
        });

        console.log("\nIntentando login con authService...");
        try {
            const loginRes = await authService.login({ email: "pepepelotudo4@gmail.com", password: "dimelo98" });
            console.log("✅ LOGIN EXITOSO:", loginRes.message || "OK");
        } catch (err) {
            console.log("❌ ERROR EN LOGIN:", err.message, "| Code:", err.code);
        }
    }
    
    process.exit(0);
}

checkUser().catch(console.error);
