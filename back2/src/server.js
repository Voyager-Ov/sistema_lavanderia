import app from "./app.js";
import { connectionManager } from "./models/connectionManager.js";

const PORT = process.env.PORT || 5000;

async function start() {
	try {
		// Initialize Central DB Connection
		await connectionManager.initCentral();
		await connectionManager.centralDb.authenticate();
		
		// Sincronizar en desarrollo
		if (process.env.NODE_ENV !== "production") {
			await connectionManager.centralDb.sync();
		}

		app.listen(PORT, "0.0.0.0", () => {
			console.log(`🚀 Servidor HTTP de Lavandería escuchando en el puerto ${PORT}`);
		});

	} catch (error) {
		console.error("No se pudo iniciar el servidor:", error);
		process.exit(1);
	}
}

start();

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [Server] Promesa rechazada sin capturar:', reason?.message || reason);
});
