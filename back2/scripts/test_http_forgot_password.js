import dotenv from "dotenv";
dotenv.config();

async function testHttpForgot() {
    console.log("🚀 Probando POST /api/auth/forgot-password via HTTP...");
    try {
        const res = await fetch("http://localhost:5001/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "octavio.velo22@gmail.com" })
        });

        console.log("📡 HTTP Status Code:", res.status);
        const data = await res.json();
        console.log("📄 Response Data:", JSON.stringify(data));

        if (res.ok) {
            console.log("🎉 HTTP ENDPOINT PASÓ CON ÉXITO 200 OK!");
            process.exit(0);
        } else {
            console.error("❌ El endpoint HTTP devolvió un error:", res.status, data);
            process.exit(1);
        }
    } catch (e) {
        console.error("❌ Error conectando al servidor (asegúrate de que back2 esté corriendo):", e.message);
        process.exit(1);
    }
}

testHttpForgot();
