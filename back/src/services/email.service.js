import nodemailer from "nodemailer";

let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000
        });
    }
    return transporter;
};

/**
 * Función genérica para enviar correos electrónicos
 */
export const enviarEmail = async (to, subject, html) => {
    // Si es un correo de prueba ficticio o no están configuradas las credenciales, solo imprimimos en consola
    const isTestEmail = to && (to.endsWith("@test.com") || to.endsWith("@example.com") || to.includes("test_") || process.env.NODE_ENV === "test");
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || isTestEmail) {
        console.log("-----------------------------------------------------");
        console.log(`✉️ EMAIL SIMULADO (${isTestEmail ? 'Email de test' : 'Credenciales no configuradas'})`);
        console.log(`Destinatario: ${to}`);
        console.log(`Asunto: ${subject}`);
        console.log("-----------------------------------------------------");
        return;
    }

    try {
        const mailTransporter = getTransporter();
        await mailTransporter.sendMail({
            from: `"Lavandería SaaS" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`✅ Correo enviado exitosamente a ${to}`);
    } catch (error) {
        console.warn(`⚠️ [EmailService] No se pudo enviar el correo a ${to} (posible dirección no existente):`, error.message);
    }
};

export const enviarCodigoVerificacion = async (email, nombre, code) => {
    // Frontend URL real debería venir del .env, hardcodeamos para demo si no existe
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontendUrl}/verify-email?token=${code}&email=${email}`;
    
    const subject = "Verifica tu cuenta - Código de Seguridad";
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #4A90E2; text-align: center;">¡Bienvenido, ${nombre}!</h2>
            <p>Gracias por registrarte en nuestra plataforma.</p>
            <p>Para activar tu cuenta y poder iniciar sesión, por favor haz clic en el siguiente enlace:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    Verificar mi Cuenta
                </a>
            </div>
            <p>O ingresa manualmente este código de verificación de 6 dígitos en la aplicación:</p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 4px; margin: 20px 0;">
                ${code}
            </div>
            <p>Este código y enlace <strong>expirarán en 24 horas</strong>.</p>
            <p style="color: #888; font-size: 12px; margin-top: 30px;">Si no solicitaste crear esta cuenta, puedes ignorar este correo.</p>
        </div>
    `;

    await enviarEmail(email, subject, html);
};

export const enviarEnlaceRecuperacion = async (email, nombre, token) => {
    // Frontend URL real debería venir del .env, hardcodeamos para demo si no existe
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendUrl}/reset-password?token=${token}&email=${email}`;
    
    const subject = "Recuperación de Contraseña";
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #E24A4A; text-align: center;">Recuperación de Contraseña</h2>
            <p>Hola ${nombre},</p>
            <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #E24A4A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    Restablecer Contraseña
                </a>
            </div>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #4A90E2;">${resetUrl}</p>
            <p>Este enlace <strong>expirará en 1 hora</strong>.</p>
            <p style="color: #888; font-size: 12px; margin-top: 30px;">Si no solicitaste este cambio, por favor ignora este correo.</p>
        </div>
    `;

    await enviarEmail(email, subject, html);
};
