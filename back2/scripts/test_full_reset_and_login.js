import dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import app from "../src/app.js";
import { connectionManager } from "../src/models/connectionManager.js";
import { passwordService } from "../src/modules/auth/services/password.service.js";

async function main() {
    console.log("🚀 Probando restablecimiento de contraseña y login posterior para octavio.velo2022@gmail.com...");
    await connectionManager.initCentral();

    // 1. Forgot password
    await passwordService.forgotPassword("octavio.velo2022@gmail.com");

    const { Usuario } = connectionManager.centralModels;
    const user = await Usuario.findByPk("octavio.velo2022@gmail.com");

    // 2. Reset password
    const testPassword = "ClaveValidaSuperAdmin2026!";
    await passwordService.resetPassword({
        token: user.tokenConfirmacion,
        email: "octavio.velo2022@gmail.com",
        newPassword: testPassword
    });

    // 3. Login via /api/superadmin/login
    const res = await request(app)
        .post("/api/superadmin/login")
        .send({
            email: "octavio.velo2022@gmail.com",
            password: testPassword
        });

    console.log("📡 Status Code:", res.status);
    console.log("📄 Response Body:", JSON.stringify(res.body));

    if (res.status === 200 && res.body.token) {
        console.log("🎉 LOGIN DE SUPERADMIN EXITOSO Y AUTENTICADO AL 100%!");
        process.exit(0);
    } else {
        console.error("❌ Falló el login de SuperAdmin:", res.status, res.body);
        process.exit(1);
    }
}

main().catch(err => {
    console.error("💥 Error en ejecución:", err);
    process.exit(1);
});
