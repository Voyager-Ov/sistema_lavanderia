import { Server } from "socket.io";

let io = null;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        },
        transports: ["websocket", "polling"]
    });

    io.on("connection", (socket) => {
        // Suscripción por Tenant/Negocio
        socket.on("join:tenant", (negocioId) => {
            if (negocioId) {
                socket.join(`tenant_${negocioId}`);
            }
        });

        // Suscripción por Código de Seguimiento Público
        socket.on("join:tracking", (codigoSeguimiento) => {
            if (codigoSeguimiento) {
                socket.join(`tracking_${codigoSeguimiento}`);
            }
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        // Fallback silencioso si aún no inicializado
        return {
            to: () => ({ emit: () => {} }),
            emit: () => {}
        };
    }
    return io;
};
