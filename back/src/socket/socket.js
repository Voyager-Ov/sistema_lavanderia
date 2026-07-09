import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*", // En producción deberías restringir esto a los microfrontends permitidos
            methods: ["GET", "POST"]
        }
    });

    // Middleware de autenticación para los sockets
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
            return next(new Error("Error de autenticación: Token no proporcionado"));
        }

        try {
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                return next(new Error("Error del servidor: JWT_SECRET no configurado"));
            }
            const decoded = jwt.verify(token, secret);
            socket.user = decoded; // { id, negocioId, rol, ... }
            next();
        } catch (error) {
            return next(new Error("Error de autenticación: Token inválido"));
        }
    });

    io.on("connection", (socket) => {
        const { negocioId, rol, id } = socket.user;
        
        if (!negocioId) {
            // Es un superadmin o un usuario sin negocio asignado
            socket.join("superadmin_room");
            console.log(`🔌 [Socket.io] SuperAdmin (ID: ${id}) conectado.`);
        } else {
            // Unir al usuario a la sala de su lavandería (Tenant)
            const roomName = `room_${negocioId}`;
            socket.join(roomName);
            console.log(`🔌 [Socket.io] Usuario (ID: ${id}, Rol: ${rol}) unido a la sala ${roomName}`);
        }

        socket.on("disconnect", () => {
            console.log(`🔌 [Socket.io] Usuario (ID: ${id}) desconectado.`);
        });
    });

    return io;
};

/**
 * Emite un evento a todos los clientes conectados de un tenant específico.
 * @param {Number|String} negocioId El ID del negocio (tenant).
 * @param {String} eventName El nombre del evento (ej: 'pedido_actualizado').
 * @param {Object} data Los datos a enviar.
 */
export const emitToTenant = (negocioId, eventName, data) => {
    if (!io) {
        console.warn("⚠️ [Socket.io] Intento de emitir evento antes de inicializar socket.io");
        return;
    }
    
    if (negocioId) {
        io.to(`room_${negocioId}`).emit(eventName, data);
    }
};
