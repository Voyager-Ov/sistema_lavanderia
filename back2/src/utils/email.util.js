import nodemailer from "nodemailer";

class EmailService {
    constructor() {
        this.transporter = null;
        this.init();
    }

    init() {
        const user = process.env.SMTP_USER || process.env.EMAIL_USER;
        const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
        const host = process.env.SMTP_HOST || "smtp.gmail.com";
        const port = parseInt(process.env.SMTP_PORT || "465");
        const secure = process.env.SMTP_SECURE === "false" ? false : (port === 465);

        if (user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure,
                auth: {
                    user,
                    pass,
                },
            });
            console.log(`📧 [Email] Transporter SMTP configurado activamente para: ${user}`);
        }
    }

    async enviarCodigoVerificacion(email, nombre, codigo) {
        const nombreLimpio = (nombre && nombre !== "undefined") ? nombre : (email ? email.split("@")[0] : "Usuario");
        const codigoLimpio = (codigo && codigo !== "undefined") ? String(codigo).trim() : "";

        const asunto = "Verifica tu cuenta - Sistema Lavandería";
        const text = `Hola ${nombreLimpio},\n\nTu código de verificación para completar tu registro es: ${codigoLimpio}\n\nEste código expira en 24 horas.`;
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>¡Bienvenido a Lavandería SaaS!</h2>
                <p>Hola <strong>${nombreLimpio}</strong>,</p>
                <p>Tu código de verificación es:</p>
                <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">
                    ${codigoLimpio}
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

    async enviarAlertaSeguridad({ usuarioEmail, rol, endpoint, metodo, ip, userAgent, negocioId }) {
        const destinoMail = "octavio.velo2022@gmail.com";
        const asunto = `🚨 [ALERTA DE SEGURIDAD] Intento de Acceso no Autorizado - ${usuarioEmail || 'Desconocido'}`;
        const fechaHora = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 650px; border: 1px solid #e11d48; border-radius: 10px;">
                <div style="background-color: #be123c; color: white; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold;">
                    ⚠️ Alerta de Seguridad RBAC - Intento de Violación de Acceso
                </div>
                <div style="padding: 15px 0;">
                    <p style="font-size: 15px;">Se ha detectado un intento de acceso no autorizado a un recurso protegido en el sistema:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr style="background: #f4f4f5;"><td style="padding: 10px; font-weight: bold; width: 180px;">Usuario Email:</td><td style="padding: 10px;">${usuarioEmail || "N/A"}</td></tr>
                        <tr><td style="padding: 10px; font-weight: bold;">Rol Detectado:</td><td style="padding: 10px; color: #e11d48; font-weight: bold;">${rol || "Desconocido"}</td></tr>
                        <tr style="background: #f4f4f5;"><td style="padding: 10px; font-weight: bold;">Endpoint Objetivo:</td><td style="padding: 10px;"><code>${metodo || "GET"} ${endpoint}</code></td></tr>
                        <tr><td style="padding: 10px; font-weight: bold;">Negocio ID:</td><td style="padding: 10px;">${negocioId || "Global"}</td></tr>
                        <tr style="background: #f4f4f5;"><td style="padding: 10px; font-weight: bold;">Dirección IP:</td><td style="padding: 10px;">${ip || "Desconocida"}</td></tr>
                        <tr><td style="padding: 10px; font-weight: bold;">Fecha / Hora:</td><td style="padding: 10px;">${fechaHora} hs (ARG)</td></tr>
                        <tr style="background: #f4f4f5;"><td style="padding: 10px; font-weight: bold;">User Agent:</td><td style="padding: 10px; font-size: 11px; font-family: monospace;">${userAgent || "Desconocido"}</td></tr>
                    </table>
                </div>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                    El servidor ha rechazado la solicitud con estado <strong>HTTP 403 FORBIDDEN</strong> y la sesión ha sido revocada automáticamente en el cliente.
                </div>
            </div>
        `;

        if (this.transporter) {
            try {
                await this.transporter.sendMail({
                    from: process.env.SMTP_FROM || '"Seguridad Sistema" <no-reply@lavanderia.com>',
                    to: destinoMail,
                    subject: asunto,
                    html,
                });
                console.log(`🚨 [Alerta de Seguridad] Notificación enviada a ${destinoMail}`);
            } catch (err) {
                console.error(`❌ [Email Security Alert Error]:`, err.message);
            }
        } else {
            console.log(`🚨 [SECURITY MOCK ALERT] Enviada a: ${destinoMail} | Usuario: ${usuarioEmail} | Endpoint: ${metodo} ${endpoint}`);
        }
    }
}

export const emailService = new EmailService();
