import nodemailer from "nodemailer";

class EmailService {
    constructor() {
        this.transporter = null;
        this.defaultFrom = '"Sistema Lavandería" <octavio.velo2022@gmail.com>';
        this.init();
    }

    init() {
        const user = process.env.SMTP_USER || process.env.EMAIL_USER;
        const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
        const host = process.env.SMTP_HOST || "smtp.gmail.com";
        const port = parseInt(process.env.SMTP_PORT || "465");
        const secure = process.env.SMTP_SECURE === "false" ? false : (port === 465);

        if (user && pass) {
            const isGmail = host.includes("gmail") || user.endsWith("@gmail.com");
            this.transporter = nodemailer.createTransport(
                isGmail
                    ? {
                        service: "gmail",
                        auth: { user, pass }
                    }
                    : {
                        host,
                        port,
                        secure,
                        auth: { user, pass }
                    }
            );

            this.defaultFrom = process.env.SMTP_FROM || `"Sistema Lavandería" <${user}>`;
            console.log(`📧 [Email] Transporter SMTP configurado activamente para: ${user}`);
        }
    }

    _getTransporter() {
        if (!this.transporter) {
            this.init();
        }
        return this.transporter;
    }

    async enviarCodigoVerificacion(email, nombre, codigo) {
        const transporter = this._getTransporter();
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

        if (transporter) {
            try {
                await transporter.sendMail({
                    from: this.defaultFrom,
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
        const transporter = this._getTransporter();
        const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        const asunto = "🔑 Restablece tu contraseña - Sistema Lavandería";
        const text = `Hola,\n\nSolicitaste restablecer tu contraseña. Haz clic en el siguiente enlace o pégalo en tu navegador:\n\n${resetUrl}\n\nSi no realizaste esta solicitud, ignora este correo.`;
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 650px; border: 1px solid #2563eb; border-radius: 10px;">
                <h2 style="color: #2563eb;">Restablecimiento de Contraseña</h2>
                <p>Hola <strong>${email}</strong>,</p>
                <p>Has solicitado crear o cambiar tu contraseña de acceso al sistema.</p>
                <p>Haz clic en el siguiente botón para definir tu nueva contraseña:</p>
                <div style="margin: 25px 0;">
                    <a href="${resetUrl}" style="background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        Restablecer mi Contraseña
                    </a>
                </div>
                <p style="font-size: 12px; color: #666;">O copia este enlace en tu navegador:<br><a href="${resetUrl}">${resetUrl}</a></p>
                <p style="font-size: 11px; color: #999; margin-top: 20px;">Este token expira en 1 hora.</p>
            </div>
        `;

        if (transporter) {
            try {
                await transporter.sendMail({
                    from: this.defaultFrom,
                    to: email,
                    subject: asunto,
                    text,
                    html,
                });
                console.log(`📧 [Email] Enlace de restablecimiento enviado exitosamente a ${email}`);
            } catch (err) {
                console.error(`❌ [Email] Error al enviar email a ${email}:`, err.message);
            }
        } else {
            console.log(`✉️ [EMAIL MOCK] Para: ${email} | Asunto: ${asunto} | Enlace: ${resetUrl}`);
        }
    }

    async enviarAlertaSeguridad({ usuarioEmail, rol, endpoint, metodo, ip, userAgent, negocioId }) {
        const transporter = this._getTransporter();
        const destinoMail = process.env.SUPERADMIN_EMAIL || "octavio.velo2022@gmail.com";
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
            </div>
        `;

        if (transporter) {
            try {
                await transporter.sendMail({
                    from: this.defaultFrom,
                    to: destinoMail,
                    subject: asunto,
                    html,
                });
                console.log(`🚨 [Alerta de Seguridad] Notificación enviada a ${destinoMail}`);
            } catch (err) {
                console.error(`❌ [Email Security Alert Error]:`, err.message);
            }
        }
    }

    async enviarAlertaFotosNegocio({ negocioId, usuarioEmail, totalFotos, ip }) {
        const transporter = this._getTransporter();
        const destinoMail = process.env.SUPERADMIN_EMAIL || "octavio.velo2022@gmail.com";
        const asunto = `🚨 [ALERTA DE ALMACENAMIENTO] Intento de Exceder 30 Fotos - Negocio #${negocioId}`;
        const fechaHora = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 650px; border: 2px solid #e11d48; border-radius: 10px;">
                <div style="background-color: #be123c; color: white; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold;">
                    🚨 ALERTA: Límite de 30 Imágenes Superado
                </div>
                <div style="padding: 15px 0;">
                    <p style="font-size: 15px;">Se ha bloqueado un intento de subir más de 30 fotos para el mismo negocio:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr style="background: #f4f4f5;"><td style="padding: 10px; font-weight: bold; width: 180px;">Negocio ID:</td><td style="padding: 10px; color: #e11d48; font-weight: bold;">#${negocioId}</td></tr>
                        <tr><td style="padding: 10px; font-weight: bold;">Usuario Solicitante:</td><td style="padding: 10px;">${usuarioEmail || "Empleado / Admin"}</td></tr>
                        <tr style="background: #f4f4f5;"><td style="padding: 10px; font-weight: bold;">Fotos Activas Actuales:</td><td style="padding: 10px;">${totalFotos} / 30 Máximo</td></tr>
                        <tr><td style="padding: 10px; font-weight: bold;">Dirección IP:</td><td style="padding: 10px;">${ip || "Desconocida"}</td></tr>
                        <tr style="background: #f4f4f5;"><td style="padding: 10px; font-weight: bold;">Fecha / Hora:</td><td style="padding: 10px;">${fechaHora} hs (ARG)</td></tr>
                    </table>
                </div>
            </div>
        `;

        if (transporter) {
            try {
                await transporter.sendMail({
                    from: this.defaultFrom,
                    to: destinoMail,
                    subject: asunto,
                    html,
                });
                console.log(`🚨 [Alerta Almacenamiento] Correo enviado a ${destinoMail}`);
            } catch (err) {
                console.error(`❌ [Email Error]:`, err.message);
            }
        }
    }

    async enviarAlertaLimiteStorage({ espacioConsumidoBytes, maxBytes, negocioId, ip }) {
        const transporter = this._getTransporter();
        const destinoMail = process.env.SUPERADMIN_EMAIL || "octavio.velo2022@gmail.com";
        const asunto = `🔥 [ALERTA CRÍTICA 1 GB] Límite de Almacenamiento Alcanzado`;
        const fechaHora = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
        const mbOcupados = (espacioConsumidoBytes / (1024 * 1024)).toFixed(2);

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 650px; border: 2px solid #b91c1c; border-radius: 10px;">
                <div style="background-color: #991b1b; color: white; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold;">
                    🔥 CRÍTICO: Límite de 1 GB Almacenamiento Alcanzado
                </div>
                <div style="padding: 15px 0;">
                    <p style="font-size: 15px;">El sistema ha alcanzado o superado el tope de seguridad de 1 GB en Cloudflare R2 / Disco:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr style="background: #f4f4f5;"><td style="padding: 10px; font-weight: bold; width: 180px;">Consumo Actual:</td><td style="padding: 10px; color: #b91c1c; font-weight: bold;">${mbOcupados} MB / 1024 MB (1 GB)</td></tr>
                        <tr><td style="padding: 10px; font-weight: bold;">Negocio Intentando Subir:</td><td style="padding: 10px;">#${negocioId || "Global"}</td></tr>
                        <tr style="background: #f4f4f5;"><td style="padding: 10px; font-weight: bold;">IP Origen:</td><td style="padding: 10px;">${ip || "Desconocida"}</td></tr>
                        <tr><td style="padding: 10px; font-weight: bold;">Fecha / Hora:</td><td style="padding: 10px;">${fechaHora} hs (ARG)</td></tr>
                    </table>
                </div>
            </div>
        `;

        if (transporter) {
            try {
                await transporter.sendMail({
                    from: this.defaultFrom,
                    to: destinoMail,
                    subject: asunto,
                    html,
                });
                console.log(`🔥 [Alerta Crítica 1GB] Correo enviado a ${destinoMail}`);
            } catch (err) {
                console.error(`❌ [Email Error]:`, err.message);
            }
        }
    }

    async enviarNotificacionNuevaSolicitudSuperAdmin(solicitud) {
        const transporter = this._getTransporter();
        const destinoMail = process.env.SUPERADMIN_EMAIL || "octavio.velo2022@gmail.com";
        const asunto = `📋 [NUEVA SOLICITUD DE NEGOCIO] ${solicitud.nombreNegocio || "Nuevo Registro"}`;
        const fechaHora = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 650px; border: 1px solid #2563eb; border-radius: 10px;">
                <div style="background-color: #2563eb; color: white; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold;">
                    📋 Nueva Solicitud de Apertura de Negocio
                </div>
                <div style="padding: 15px 0;">
                    <p style="font-size: 15px;">Se ha recibido una nueva solicitud de registro de negocio pendiente de tu aprobación en el portal Super Admin:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr style="background: #f4f4f5;"><td style="padding: 10px; font-weight: bold; width: 180px;">Nombre Negocio:</td><td style="padding: 10px; color: #2563eb; font-weight: bold;">${solicitud.nombreNegocio}</td></tr>
                        <tr><td style="padding: 10px; font-weight: bold;">Solicitante:</td><td style="padding: 10px;">${solicitud.nombreSolicitante}</td></tr>
                        <tr style="background: #f4f4f5;"><td style="padding: 10px; font-weight: bold;">Email Solicitante:</td><td style="padding: 10px;">${solicitud.emailSolicitante}</td></tr>
                        <tr><td style="padding: 10px; font-weight: bold;">Teléfono:</td><td style="padding: 10px;">${solicitud.telefonoSolicitante || "N/A"}</td></tr>
                        <tr style="background: #f4f4f5;"><td style="padding: 10px; font-weight: bold;">CUIT / Razón Social:</td><td style="padding: 10px;">${solicitud.cuit || "N/A"} / ${solicitud.razonSocial || "N/A"}</td></tr>
                        <tr><td style="padding: 10px; font-weight: bold;">Fecha Solicitud:</td><td style="padding: 10px;">${fechaHora} hs (ARG)</td></tr>
                    </table>
                </div>
            </div>
        `;

        if (transporter) {
            try {
                await transporter.sendMail({
                    from: this.defaultFrom,
                    to: destinoMail,
                    subject: asunto,
                    html,
                });
                console.log(`📧 [SuperAdmin Notification] Solicitud enviada a ${destinoMail}`);
            } catch (err) {
                console.error(`❌ [Email Error]:`, err.message);
            }
        } else {
            console.log(`✉️ [EMAIL MOCK SUPERADMIN] Nueva solicitud de: ${solicitud.emailSolicitante} (${solicitud.nombreNegocio})`);
        }
    }

    async enviarResultadoSolicitudNegocio({ email, nombre, negocioNombre, estado, motivoRechazo }) {
        const transporter = this._getTransporter();
        const aprobado = estado === "APROBADO";
        const asunto = aprobado 
            ? `🎉 ¡Solicitud Aprobada! Tu negocio ${negocioNombre} ya está activo` 
            : `⚠️ Estado de tu Solicitud de Negocio: ${negocioNombre}`;

        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 650px; border: 1px solid ${aprobado ? '#16a34a' : '#dc2626'}; border-radius: 10px;">
                <div style="background-color: ${aprobado ? '#16a34a' : '#dc2626'}; color: white; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold;">
                    ${aprobado ? '🎉 ¡Felicidades! Solicitud Aprobada' : '⚠️ Estado de tu Solicitud de Registro'}
                </div>
                <div style="padding: 15px 0;">
                    <p>Hola <strong>${nombre || email}</strong>,</p>
                    ${aprobado ? `
                        <p style="font-size: 15px;">Tu solicitud para la apertura de <strong>${negocioNombre}</strong> ha sido aprobada exitosamente por el Super Admin.</p>
                    ` : `
                        <p style="font-size: 15px;">Lamentamos informarte que tu solicitud de registro para el negocio <strong>${negocioNombre}</strong> ha sido rechazada.</p>
                        ${motivoRechazo ? `<div style="background: #fef2f2; padding: 12px; border-radius: 6px; color: #991b1b; margin-top: 10px;"><strong>Motivo:</strong> ${motivoRechazo}</div>` : ''}
                    `}
                </div>
            </div>
        `;

        if (transporter) {
            try {
                await transporter.sendMail({
                    from: this.defaultFrom,
                    to: email,
                    subject: asunto,
                    html,
                });
                console.log(`📧 [Resultado Solicitud] Correo enviado a ${email} (${estado})`);
            } catch (err) {
                console.error(`❌ [Email Error]:`, err.message);
            }
        } else {
            console.log(`✉️ [EMAIL MOCK] Para: ${email} | Estado: ${estado} | Negocio: ${negocioNombre}`);
        }
    }
}

export const emailService = new EmailService();
