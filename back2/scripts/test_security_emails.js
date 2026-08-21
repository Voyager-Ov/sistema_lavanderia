import "dotenv/config";
import { emailService } from "../src/utils/email.util.js";

async function testSecurityEmails() {
    console.log("--------------------------------------------------");
    console.log("🧪 PRUEBA DE ENVÍO EN VIVO DE EMAILS DE ALERTA DE SEGURIDAD");
    console.log("--------------------------------------------------");
    console.log(" Destino de Alerta:", process.env.EMAIL_USER || "octavio.velo2022@gmail.com");
    console.log(" Servidor SMTP Active?:", emailService.transporter ? "YES (Gmail SMTP)" : "NO (Mock)");
    console.log("--------------------------------------------------\n");

    console.log("1️⃣ Enviando Correo de Alerta: Exceso de 30 fotos por negocio...");
    await emailService.enviarAlertaFotosNegocio({
        negocioId: 13,
        usuarioEmail: "empleado.sospechoso@lavanderia.com",
        totalFotos: 31,
        ip: "190.18.245.12"
    });
    console.log("   ✅ Alerta de 30 fotos enviada con éxito por correo!");

    console.log("\n2️⃣ Enviando Correo de Alerta Crítica: Límite de 1 GB alcanzado...");
    await emailService.enviarAlertaLimiteStorage({
        espacioConsumidoBytes: 1073741824, // 1 GB
        maxBytes: 1073741824,
        negocioId: 13,
        ip: "190.18.245.12"
    });
    console.log("   ✅ Alerta crítica de 1 GB enviada con éxito por correo!");

    console.log("--------------------------------------------------");
    console.log("🏁 PRUEBA DE CORREOS DE SEGURIDAD COMPLETADA EXITOSAMENTE");
    console.log("--------------------------------------------------");
    process.exit(0);
}

testSecurityEmails().catch(err => {
    console.error("💥 Error en prueba de emails:", err);
    process.exit(1);
});
