import nodemailer from "nodemailer";

class EmailService {
    constructor() {
        this.transporter = null;
        this.init();
    }

    init() {
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || "587"),
                secure: process.env.SMTP_SECURE === "true",
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
    }

    async enviarCodigoVerificacion(email, nombre, codigo) {
        const asunto = "Verifica tu cuenta - Sistema Lavandería";
        const text = `Hola ${nombre || ""},\n\nTu código de verificación para completar tu registro es: ${codigo}\n\nEste código expira en 24 horas.`;
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>¡Bienvenido a Lavandería SaaS!</h2>
                <p>Hola <strong>${nombre || email}</strong>,</p>
                <p>Tu código de verificación es:</p>
                <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">
                    ${codigo}
                </div>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">Este código es válido por 24 horas.</p>
            </div>
        `;

        if (this.transporter) {
            try {
                await this.transporter.sendMail({
                    from: process.env.SMTP_FROM || '"Lavandería SaaS" <no-reply@lavanderia.com>',
                    to: email,
                    subject: asunto,
                    text,
                    html,
                });
                console.log(`📧 [Email] Código de verificación enviado a ${email}`);
            } catch (err) {
                console.error(`❌ [Email] Error al enviar email a ${email}:`, err.message);
            }
        } else {
            console.log(`✉️ [EMAIL MOCK] Para: ${email} | Asunto: ${asunto} | Código: ${codigo}`);
        }
    }

    async enviarRestablecimientoPassword(email, token) {
        const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const resetUrl = `${appUrl}/reset-password?token=${token}`;
        const asunto = "Restablece tu contraseña - Sistema Lavandería";
        const text = `Hola,\n\nSolicitaste restablecer tu contraseña. Haz clic en el siguiente enlace o pégalo en tu navegador:\n\n${resetUrl}\n\nSi no realizaste esta solicitud, ignora este correo.`;
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>Restablecimiento de Contraseña</h2>
                <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                <div style="margin: 25px 0;">
                    <a href="${resetUrl}" style="background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Restablecer Contraseña
                    </a>
                </div>
                <p style="font-size: 12px; color: #666;">O copia este enlace: <a href="${resetUrl}">${resetUrl}</a></p>
            </div>
        `;

        if (this.transporter) {
            try {
                await this.transporter.sendMail({
                    from: process.env.SMTP_FROM || '"Lavandería SaaS" <no-reply@lavanderia.com>',
                    to: email,
                    subject: asunto,
                    text,
                    html,
                });
                console.log(`📧 [Email] Enlace de restablecimiento enviado a ${email}`);
            } catch (err) {
                console.error(`❌ [Email] Error al enviar email a ${email}:`, err.message);
            }
        } else {
            console.log(`✉️ [EMAIL MOCK] Para: ${email} | Asunto: ${asunto} | Enlace: ${resetUrl}`);
        }
    }
}

export const emailService = new EmailService();
