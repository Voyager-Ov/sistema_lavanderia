import app from "./app.js";
import { connectionManager } from "./models/connectionManager.js";
import { initSocket } from "./socket/socket.js";
import { checkEnvVariables } from "./utils/envChecker.util.js";
import { setupGracefulShutdown } from "./utils/shutdown.util.js";

// 1. Fail-Fast: Validar variables de entorno críticas ANTES de arrancar
checkEnvVariables();

const PORT = process.env.PORT || 5000; // Update port to 5000

async function start() {
	try {
		await connectionManager.initCentral();
		await connectionManager.centralDb.authenticate();
		// Evitamos sync() destructivo en produccion, lo delegamos a migraciones o seeds
		if (process.env.NODE_ENV !== "production") {
			await connectionManager.centralDb.sync();
		}

		const server = app.listen(PORT, () => {
			console.log(`🚀 Servidor HTTP de Lavandería escuchando en el puerto ${PORT}`);
		});

		// Inicializamos WebSockets usando el mismo servidor HTTP
		initSocket(server);

		// 2. Configurar el apagado seguro (Graceful Shutdown) para atrapar caídas o reinicios
		setupGracefulShutdown(server);

	} catch (error) {
		console.error("No se pudo iniciar el servidor:", error);
		process.exit(1);
	}
}

start();

// Evitar que promesas rechazadas no capturadas (ej: de Baileys) tiren el servidor
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [Server] Promesa rechazada sin capturar:', reason?.message || reason);
    // No hacemos process.exit() para que el servidor siga corriendo
});
