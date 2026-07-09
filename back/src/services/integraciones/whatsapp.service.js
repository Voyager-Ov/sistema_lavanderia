import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import { connectionManager } from "../../models/connectionManager.js";
import { emitToTenant } from "../../socket/socket.js";
import { AppError } from "../../utils/errors.js";

// Diccionario en memoria para almacenar los sockets de cada negocio
const sessions = new Map();
const qrs = new Map();

// Directorio donde guardaremos las credenciales de WhatsApp
const SESSIONS_DIR = path.join(process.cwd(), "sessions");
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

/**
 * Actualiza el estado de la conexión en la base de datos de Configuración
 */
const setEstadoConexion = async (negocioId, estado) => {
    const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
    await ConfiguracionNegocio.update({ whatsappEstadoConexion: estado }, { where: { negocioId } });
    
    // Notificamos al frontend del negocio sobre el cambio de estado
    emitToTenant(negocioId, "whatsapp_estado", { estado });
};

/**
 * Inicializa la conexión de WhatsApp para un negocio específico
 */
export const conectarWhatsApp = async (negocioId) => {
    if (sessions.has(negocioId)) {
        return { success: true, message: "WhatsApp ya está corriendo para este negocio." };
    }

    const sessionPath = path.join(SESSIONS_DIR, `tenant_${negocioId}`);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ["Lavanderia SaaS", "Chrome", "1.0.0"],
    });

    sessions.set(negocioId, sock);
    
    // Inicializamos como esperando QR o conectando
    await setEstadoConexion(negocioId, "ESPERANDO_QR");

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // Guardar el QR en memoria como base64 para que el frontend lo pueda pedir
            try {
                const qrBase64 = await QRCode.toDataURL(qr);
                qrs.set(negocioId, qrBase64);
                emitToTenant(negocioId, "whatsapp_qr", { qr: qrBase64 });
            } catch (err) {
                console.error("Error generando QR:", err);
            }
        }

        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            console.log(`❌ Conexión de WhatsApp cerrada para negocio ${negocioId}. Reconectar: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                // Reconectar automáticamente si fue un error temporal
                setTimeout(() => conectarWhatsApp(negocioId), 5000);
            } else {
                // Se cerró la sesión manual (Logged Out)
                desconectarWhatsApp(negocioId, true);
            }
        } else if (connection === "open") {
            console.log(`✅ WhatsApp conectado para negocio ${negocioId}`);
            qrs.delete(negocioId); // Ya no necesitamos el QR
            await setEstadoConexion(negocioId, "CONECTADO");
        }
    });

    return { success: true, message: "Proceso de conexión iniciado." };
};

/**
 * Desconecta WhatsApp, elimina la sesión del mapa y de la BD, y opcionalmente borra los tokens.
 */
export const desconectarWhatsApp = async (negocioId, borrarTokens = true) => {
    const sock = sessions.get(negocioId);
    
    if (sock) {
        sock.logout();
        sessions.delete(negocioId);
    }
    
    qrs.delete(negocioId);

    if (borrarTokens) {
        const sessionPath = path.join(SESSIONS_DIR, `tenant_${negocioId}`);
        if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
        }
        await setEstadoConexion(negocioId, "DESCONECTADO");
    }
    
    return { success: true, message: "Sesión de WhatsApp cerrada exitosamente." };
};

/**
 * Obtiene el estado actual y el QR (si existe)
 */
export const obtenerEstadoWhatsApp = async (negocioId) => {
    const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
    const config = await ConfiguracionNegocio.findOne({ where: { negocioId } });
    
    return {
        estado: config ? config.whatsappEstadoConexion : "DESCONECTADO",
        activo: config ? config.whatsappActivo : false,
        qr: qrs.get(negocioId) || null
    };
};

/**
 * Envía un mensaje a un número específico
 */
export const enviarMensajeWhatsApp = async (negocioId, numeroTelefono, mensaje) => {
    const sock = sessions.get(negocioId);
    
    if (!sock) {
        console.log(`⚠️ Intentando enviar mensaje, pero WhatsApp no está iniciado para el negocio ${negocioId}`);
        return false;
    }

    try {
        // Formatear el número (agregar prefijo y el @s.whatsapp.net si es necesario)
        let numeroLimpiado = numeroTelefono.replace(/[^0-9]/g, "");
        if (!numeroLimpiado.startsWith("549")) {
             // Adaptar según el país, asumimos Argentina
            if (numeroLimpiado.startsWith("0")) numeroLimpiado = numeroLimpiado.substring(1);
            if (numeroLimpiado.startsWith("15")) numeroLimpiado = numeroLimpiado.substring(2);
            numeroLimpiado = `549${numeroLimpiado}`; 
        }
        const jid = `${numeroLimpiado}@s.whatsapp.net`;

        await sock.sendMessage(jid, { text: mensaje });
        console.log(`📩 Mensaje enviado por WhatsApp a ${jid}`);
        return true;
    } catch (error) {
        console.error("❌ Error al enviar mensaje de WhatsApp:", error);
        return false;
    }
};

/**
 * Inicializa automáticamente todos los negocios que tenían estado "CONECTADO"
 * (Llamado idealmente al arrancar el servidor Node.js)
 */
export const autoConectarNegocios = async () => {
    const ConfiguracionNegocio = connectionManager.centralModels.ConfiguracionNegocio;
    const conectados = await ConfiguracionNegocio.findAll({ 
        where: { whatsappActivo: true, whatsappEstadoConexion: "CONECTADO" } 
    });

    for (const config of conectados) {
        console.log(`🔄 Reconectando WhatsApp para negocio ${config.negocioId}...`);
        await conectarWhatsApp(config.negocioId);
    }
};
