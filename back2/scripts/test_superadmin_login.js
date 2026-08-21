import dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import app from "../src/app.js";
import { connectionManager } from "../src/models/connectionManager.js";

async function runTest() {
    console.log("🚀 Probando POST /api/superadmin/login...");
    await connectionManager.initCentral();

    const res = await request(app)
        .post("/api/superadmin/login")
        .send({
            email: "octavio.velo2022@gmail.com",
            password: "MiNuevaClaveSegura2026!"
        });

    console.log("📡 Status Code:", res.status);
    console.log("📄 Response Body:", JSON.stringify(res.body));

    if (res.status === 200 && res.body.token) {
        console.log("🎉 LOGIN DE SUPERADMIN EXITOSO AL 100%!");
        process.exit(0);
    } else {
        console.error("❌ Falló el login de SuperAdmin:", res.status, res.body);
        process.exit(1);
    }
}

runTest().catch(err => {
    console.error("💥 Error en ejecución:", err);
    process.exit(1);
});
