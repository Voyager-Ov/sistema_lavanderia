import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectionManager } from "../src/models/connectionManager.js";
import { storageService } from "../src/services/storage.service.js";
import { serviciosService } from "../src/modules/servicios/services/servicios.service.js";

async function testRealUpload() {
    console.log("--------------------------------------------------");
    console.log("🧪 PROBANDO SUBIDA Y COMPRESIÓN DE SCREENSHOT REAL");
    console.log("--------------------------------------------------");

    const imagePath = "C:/Users/pepep/.gemini/antigravity/brain/a7562bf4-3a88-41c4-8f1c-af6845c0e57e/.user_uploaded/media_1787268709581.png";

    if (!fs.existsSync(imagePath)) {
        console.error("❌ No se encontró la imagen de prueba en la ruta:", imagePath);
        process.exit(1);
    }

    const stat = fs.statSync(imagePath);
    console.log(`📌 Imagen original encontrada: media_1787268709581.png (${(stat.size / 1024).toFixed(2)} KB)`);

    // Crear mock object req.file como si viniera de Multer
    const mockFile = {
        buffer: fs.readFileSync(imagePath),
        originalname: "media_1787268709581.png",
        mimetype: "image/png"
    };

    console.log("1️⃣ Procesando y optimizando imagen con Sharp (Convertir a WebP ultra ligero)...");
    const r2Url = await storageService.uploadFile(mockFile, "productos");
    console.log("   ✅ Imagen subida y optimizada exitosamente!");
    console.log("   🔗 URL Generada:", r2Url);

    console.log("2️⃣ Actualizando Servicio ID #2 ('Lavado Completo x Bag (10kg)')...");
    await connectionManager.initCentral();
    const servicioActualizado = await serviciosService.actualizarServicio(13, 2, {}, r2Url);

    console.log("   🎉 Servicio actualizado con éxito en PostgreSQL!");
    console.log("   ID:", servicioActualizado.id);
    console.log("   Nombre:", servicioActualizado.nombre);
    console.log("   ImagenUrl en DB:", servicioActualizado.imagenUrl);

    console.log("\n3️⃣ Comprobando acceso HTTP a la imagen subida...");
    try {
        const response = await fetch(r2Url);
        console.log("   📡 HTTP Status:", response.status);
        console.log("   📄 Content-Type:", response.headers.get("content-type"));
        console.log("   📦 Content-Length (WebP optimizado):", response.headers.get("content-length"), "bytes");

        if (response.ok) {
            console.log("   ✨ ¡PRUEBA EXITOSA! La imagen de screenshot real se muestra en vivo.");
        } else {
            console.log("   ℹ️ Tip: Si responde 400/403, habilita 'R2.dev Subdomain' en la pestaña Settings de tu Bucket en Cloudflare R2.");
        }
    } catch (e) {
        console.warn("   ⚠️ No se pudo comprobar via HTTP:", e.message);
    }

    console.log("--------------------------------------------------");
    process.exit(0);
}

testRealUpload().catch(err => {
    console.error("💥 ERROR EN LA PRUEBA DE SUBIDA REAL:", err);
    process.exit(1);
});
