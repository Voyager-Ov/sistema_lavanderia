import { models, sequelize } from "../models/index.js";
import { enviarEmail } from "./email.service.js";

// Configuración de monitoreo
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
const ALERT_EMAIL = "octavio.velo2022@gmail.com";

let isMonitoring = false;
let intervalId = null;

const checkDatabase = async () => {
    try {
        // Ejecutamos una query simple para comprobar la DB central
        await sequelize.query("SELECT 1+1 AS result");
        return { status: "ok" };
    } catch (error) {
        return { status: "error", message: error.message };
    }
};

const checkMicroFrontends = async () => {
    const results = [];
    try {
        const mfs = await models.MicroFrontend.findAll({ where: { activo: true } });
        
        for (const mf of mfs) {
            try {
                const response = await fetch(mf.urlOrigen, { method: "HEAD", timeout: 5000 });
                if (response.ok || response.status < 400) {
                    results.push({ name: mf.nombre, url: mf.urlOrigen, status: "ok" });
                } else {
                    results.push({ name: mf.nombre, url: mf.urlOrigen, status: "error", message: `HTTP ${response.status}` });
                }
            } catch (err) {
                results.push({ name: mf.nombre, url: mf.urlOrigen, status: "error", message: err.message });
            }
        }
    } catch (error) {
        console.error("Error obteniendo microfrontends para monitoreo:", error);
    }
    return results;
};

export const runHealthCheck = async () => {
    const dbStatus = await checkDatabase();
    const mfStatus = await checkMicroFrontends();
    
    const failedServices = [];
    
    if (dbStatus.status === "error") {
        failedServices.push(`Base de Datos Central: ${dbStatus.message}`);
    }
    
    for (const mf of mfStatus) {
        if (mf.status === "error") {
            failedServices.push(`Microfrontend (${mf.name}): ${mf.message}`);
        }
    }

    // Si hay fallos, enviar correo de alerta
    if (failedServices.length > 0) {
        console.error("⚠️ [Monitor] Servicios caídos detectados:", failedServices);
        
        const subject = "⚠️ ALERTA: Caída de Servicio en Sistema Lavandería";
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ff4d4f; border-radius: 8px;">
                <h2 style="color: #ff4d4f;">⚠️ Alerta Crítica del Sistema</h2>
                <p>Se han detectado los siguientes servicios inalcanzables o con errores en el último chequeo:</p>
                <ul>
                    ${failedServices.map(s => `<li><strong>${s}</strong></li>`).join("")}
                </ul>
                <p>Por favor, revisa el panel de Super Admin o los logs del servidor inmediatamente.</p>
                <p style="font-size: 12px; color: #888;">Hora de detección: ${new Date().toLocaleString()}</p>
            </div>
        `;

        try {
            await enviarEmail(ALERT_EMAIL, subject, html);
            console.log("✉️ [Monitor] Correo de alerta enviado a Super Admin");
        } catch (emailErr) {
            console.error("❌ [Monitor] Error enviando correo de alerta:", emailErr);
        }
    } else {
        console.log("✅ [Monitor] Todos los servicios están operacionales");
    }

    return {
        timestamp: new Date(),
        dbStatus,
        mfStatus
    };
};

export const startMonitoring = () => {
    if (isMonitoring) return;
    
    isMonitoring = true;
    console.log(`⏱️ [Monitor] Iniciando monitoreo de salud del sistema (cada ${INTERVAL_MS / 60000} min)`);
    
    intervalId = setInterval(async () => {
        await runHealthCheck();
    }, INTERVAL_MS);
};

export const stopMonitoring = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        isMonitoring = false;
        console.log("🛑 [Monitor] Monitoreo detenido");
    }
};
