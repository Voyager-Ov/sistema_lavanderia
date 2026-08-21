import dotenv from "dotenv";
dotenv.config();

import { connectionManager } from "../src/models/connectionManager.js";
import { passwordService } from "../src/modules/auth/services/password.service.js";

async function main() {
    console.log("🚀 Probando generación y restablecimiento de contraseña para octavio.velo2022@gmail.com...");
    try {
        await connectionManager.initCentral();
        console.log("✅ BD Central conectada.");

        // 1. Generar token
        await passwordService.forgotPassword("octavio.velo2022@gmail.com");

        const { Usuario } = connectionManager.centralModels;
        const usuario = await Usuario.findByPk("octavio.velo2022@gmail.com");

        console.log("🔑 Token de restablecimiento generado en BD:", usuario.tokenConfirmacion);

        if (!usuario.tokenConfirmacion) {
            throw new Error("El token no se guardó en la base de datos.");
        }

        // 2. Probar resetPassword
        const newSecretPassword = "MiNuevaClaveSegura2026!";
        const resetRes = await passwordService.resetPassword({
            token: usuario.tokenConfirmacion,
            email: "octavio.velo2022@gmail.com",
            newPassword: newSecretPassword
        });

        console.log("🎉 Resultado de Reset:", JSON.stringify(resetRes));

        // Verificar que el token se limpió
        const usuarioActualizado = await Usuario.findByPk("octavio.velo2022@gmail.com");
        if (usuarioActualizado.tokenConfirmacion !== null) {
            throw new Error("El token de confirmación debería haber sido limpiado tras su uso.");
        }

        console.log("✨ VERIFICACIÓN DE RESET TOKEN EXITOSA AL 100%!");
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR en restablecimiento:", err);
        process.exit(1);
    }
}

main();
