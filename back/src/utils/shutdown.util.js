import { connectionManager } from "../models/connectionManager.js";

/**
 * Apaga el servidor de forma segura (Graceful Shutdown).
 * Esto asegura que las bases de datos cierren sus conexiones limpiamente
 * para evitar corrupción de datos si ocurre un error fatal o si el VPS se reinicia.
 * 
 * @param {import('http').Server} server - La instancia del servidor HTTP
 */
export const setupGracefulShutdown = (server) => {
    const shutdownHandler = async (signal) => {
        console.log(`\n=====================================================`);
        console.log(`🛑 Recibida señal ${signal}. Iniciando apagado seguro (Graceful Shutdown)...`);
        console.log(`=====================================================\n`);

        // 1. Dejar de aceptar nuevas peticiones HTTP
        server.close(async (err) => {
            if (err) {
                console.error("❌ Error al cerrar el servidor HTTP:", err);
            } else {
                console.log("✅ Servidor HTTP cerrado. No se aceptarán más peticiones.");
            }

            try {
                // 2. Desconectar todas las bases de datos (Central y Tenants)
                if (connectionManager.centralDb) {
                    await connectionManager.centralDb.close();
                    console.log("✅ Conexión a Base de Datos Central cerrada.");
                }

                for (const [negocioId, tenantContext] of connectionManager.tenantDbs.entries()) {
                    await tenantContext.sequelize.close();
                    console.log(`✅ Conexión a Base de Datos de Tenant ${negocioId} cerrada.`);
                }

                console.log("\n👋 ¡Apagado completado exitosamente! Adiós.\n");
                process.exit(0);
            } catch (shutdownError) {
                console.error("❌ Error durante el apagado de la base de datos:", shutdownError);
                process.exit(1);
            }
        });

        // Timeout de seguridad: Si después de 10 segundos no se apagó limpiamente, forzar apagado.
        setTimeout(() => {
            console.error("⚠️ Timeout: Forzando apagado del proceso después de 10 segundos.");
            process.exit(1);
        }, 10000);
    };

    // Atrapamos señales del sistema operativo (por ejemplo cuando PM2 o Docker intentan reiniciar la app)
    process.on("SIGINT", () => shutdownHandler("SIGINT (Ctrl+C)"));
    process.on("SIGTERM", () => shutdownHandler("SIGTERM"));

    // Atrapamos errores no controlados (Unhandled Promise Rejections & Uncaught Exceptions)
    process.on("unhandledRejection", (reason, promise) => {
        console.error("🚨 CRÍTICO: Unhandled Promise Rejection (Promesa rota sin atrapar):");
        console.error("Promesa:", promise, "Razón:", reason);
        console.error("Apagando el servidor por seguridad...");
        shutdownHandler("unhandledRejection");
    });

    process.on("uncaughtException", (error) => {
        console.error("🚨 CRÍTICO: Uncaught Exception (Error fatal en tiempo de ejecución):");
        console.error(error);
        console.error("Apagando el servidor por seguridad...");
        shutdownHandler("uncaughtException");
    });
};
