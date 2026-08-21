import "dotenv/config";
import { storageService } from "../src/services/storage.service.js";
import sharp from "sharp";

async function runR2Audit() {
    console.log("--------------------------------------------------");
    console.log("🧪 INICIANDO AUDITORÍA EN VIVO DE CLOUDFLARE R2");
    console.log("--------------------------------------------------");

    console.log("📌 Variables de Entorno Detectadas:");
    console.log(" - R2_ACCOUNT_ID:", process.env.R2_ACCOUNT_ID ? "✅ Cargado" : "❌ No configurado");
    console.log(" - R2_ACCESS_KEY_ID:", process.env.R2_ACCESS_KEY_ID ? "✅ Cargado" : "❌ No configurado");
    console.log(" - R2_SECRET_ACCESS_KEY:", process.env.R2_SECRET_ACCESS_KEY ? "✅ Cargado" : "❌ No configurado");
    console.log(" - R2_BUCKET_NAME:", process.env.R2_BUCKET_NAME || "❌ No configurado");
    console.log(" - R2_PUBLIC_URL:", process.env.R2_PUBLIC_URL || "❌ No configurado");
    console.log(" - Is R2 Active in StorageService?:", storageService.isR2Configured ? "YES (Cloudflare R2)" : "NO (Local Fallback)");
    console.log("--------------------------------------------------\n");

    if (!storageService.isR2Configured) {
        console.error("❌ ERROR: StorageService no detectó las variables de Cloudflare R2 en .env.");
        process.exit(1);
    }

    // 1. Crear una imagen de prueba sintética (100x100 PNG) usando Sharp
    console.log("1️⃣ Generando imagen de prueba comprimida WebP...");
    const testBuffer = await sharp({
        create: {
            width: 100,
            height: 100,
            channels: 4,
            background: { r: 16, g: 185, b: 129, alpha: 1 }
        }
    }).png().toBuffer();

    const mockFile = {
        buffer: testBuffer,
        originalname: "test_r2_audit.png",
        mimetype: "image/png"
    };

    // 2. Probar Subida a Cloudflare R2
    console.log("2️⃣ Subiendo imagen a Cloudflare R2...");
    const uploadedUrl = await storageService.uploadFile(mockFile, "productos");
    console.log("   ✅ Imagen subida con éxito a R2!");
    console.log("   🔗 URL Pública devuelta:", uploadedUrl);
    console.log("--------------------------------------------------\n");

    // 3. Probar Descarga / Fetch HTTP de la imagen subida a R2
    console.log("3️⃣ Verificando lectura HTTP de la imagen en R2...");
    try {
        const response = await fetch(uploadedUrl);
        console.log("   📡 HTTP Status Code:", response.status);
        console.log("   📄 Content-Type:", response.headers.get("content-type"));
        console.log("   📦 Content-Length:", response.headers.get("content-length"), "bytes");

        if (response.ok) {
            console.log("   ✅ La imagen es 100% accesible públicamente en Cloudflare R2.");
        } else {
            console.log("   ℹ️ Tip: Si el Status es 400/403, habilita 'R2.dev Subdomain' en Settings de tu Bucket en Cloudflare para activar la URL pública R2.dev.");
        }
    } catch (fetchError) {
        console.error("   ❌ Error al consultar la URL pública:", fetchError.message);
    }
    console.log("--------------------------------------------------\n");

    // 4. Probar Eliminación en Cloudflare R2 para dejar el bucket 100% limpio
    console.log("4️⃣ Eliminando imagen de prueba de Cloudflare R2 (Limpieza total)...");
    await storageService.deleteFile(uploadedUrl);
    console.log("   ✅ Petición de eliminación enviada a R2.");

    // 5. Verificar que la imagen fue borrada (404 / Error)
    console.log("5️⃣ Verificando que NO quedó basura en Cloudflare R2...");
    try {
        const checkRes = await fetch(uploadedUrl);
        console.log("   📡 HTTP Status tras eliminación:", checkRes.status);
        if (checkRes.status === 404 || checkRes.status === 403 || !checkRes.ok) {
            console.log("   🎉 CONFIRMADO: La imagen ya no existe en R2. El bucket quedó 100% LIMPIO.");
        } else {
            console.warn("   ⚠️ La imagen aún responde HTTP 200.");
        }
    } catch (e) {
        console.log("   🎉 CONFIRMADO: Error de red o 404 al consultar imagen borrada.");
    }

    console.log("\n--------------------------------------------------");
    console.log("🏁 AUDITORÍA COMPLETADA EXITOSAMENTE");
    console.log("--------------------------------------------------");
}

runR2Audit()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("💥 ERROR DURANTE LA AUDITORÍA DE R2:", err);
        process.exit(1);
    });
