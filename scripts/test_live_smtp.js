import dotenv from "dotenv";
dotenv.config({ path: "./back2/.env" });

import nodemailer from "nodemailer";

async function testSmtp() {
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "465");
    const secure = process.env.SMTP_SECURE === "false" ? false : (port === 465);

    console.log(`🔍 Probando conexión SMTP para: ${user} a través de ${host}:${port} (secure: ${secure})`);

    const transporter = nodemailer.createTransport({
        service: "gmail", // Recomendado para Gmail con App Passwords
        auth: {
            user,
            pass,
        },
    });

    try {
        await transporter.verify();
        console.log("✅ Servidor SMTP autenticado y verificado con éxito.");

        const targetEmail = "octavio.velo22@gmail.com";
        const testToken = "test_token_123456789";
        const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const resetUrl = `${appUrl}/reset-password?token=${testToken}&email=${encodeURIComponent(targetEmail)}`;

        const info = await transporter.sendMail({
            from: `"Sistema Lavandería" <${user}>`,
            to: targetEmail,
            subject: "🔑 Enlace para restablecer tu contraseña - Sistema Lavandería",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #2563eb; border-radius: 10px;">
                    <h2 style="color: #2563eb;">Restablecimiento de Contraseña</h2>
                    <p>Hola <strong>${targetEmail}</strong>,</p>
                    <p>Has solicitado crear o cambiar la contraseña de tu cuenta de Super Admin.</p>
                    <p>Haz clic en el siguiente botón para ingresar tu nueva contraseña:</p>
                    <div style="margin: 25px 0;">
                        <a href="${resetUrl}" style="background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; inline-block;">
                            Restablecer mi Contraseña
                        </a>
                    </div>
                    <p style="font-size: 12px; color: #666;">O copia este enlace en tu navegador:<br><a href="${resetUrl}">${resetUrl}</a></p>
                </div>
            `
        });

        console.log("📬 Email enviado exitosamente a:", targetEmail);
        console.log("   Message ID:", info.messageId);
        console.log("   Respuesta del servidor SMTP:", info.response);
    } catch (err) {
        console.error("❌ Error en envío SMTP:", err);
    }
}

testSmtp();
