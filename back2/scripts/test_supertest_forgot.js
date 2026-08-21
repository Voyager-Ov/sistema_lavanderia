import dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import app from "../src/app.js";
import { connectionManager } from "../src/models/connectionManager.js";

async function runSupertest() {
    console.log("🚀 Probando POST /api/auth/forgot-password con supertest...");
    await connectionManager.initCentral();

    const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "octavio.velo2022@gmail.com" });

    console.log("📡 HTTP Status Code:", res.status);
    console.log("📄 Response Body:", JSON.stringify(res.body));

    if (res.status === 200) {
        console.log("🎉 SUPERTEST EXITOSO: /api/auth/forgot-password respondió 200 OK!");
        process.exit(0);
    } else {
        console.error("❌ Error en supertest:", res.status, res.body);
        process.exit(1);
    }
}

runSupertest().catch(err => {
    console.error("💥 Error en ejecución:", err);
    process.exit(1);
});
