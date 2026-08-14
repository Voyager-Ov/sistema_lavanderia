import "dotenv/config";
import { emailService } from "../src/utils/email.util.js";

async function run() {
    const targetEmail = "octavio.velo2022@gmail.com";
    console.log(`🚀 Iniciando prueba de envío real de email a ${targetEmail}...`);

    const codigoPrueba = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`📌 Generado código de verificación de prueba: ${codigoPrueba}`);

    await emailService.enviarCodigoVerificacion(targetEmail, "Octavio Velo", codigoPrueba);
    console.log(`✅ [OK] Correo de verificación enviado exitosamente a ${targetEmail}`);

    const tokenReset = "test_reset_token_" + Date.now();
    await emailService.enviarRestablecimientoPassword(targetEmail, tokenReset);
    console.log(`✅ [OK] Correo de restablecimiento enviado exitosamente a ${targetEmail}`);

    process.exit(0);
}

run().catch((err) => {
    console.error("❌ Error en la prueba de email:", err);
    process.exit(1);
});
