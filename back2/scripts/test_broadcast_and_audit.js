import dotenv from "dotenv";
dotenv.config();

import { connectionManager } from "../src/models/connectionManager.js";
import { superAdminService } from "../src/modules/superadmin/services/superadmin.service.js";

async function runTest() {
    console.log("🚀 Probando creación de mensajes broadcast y consulta de auditoría...");
    try {
        await connectionManager.initCentral();
        console.log("🟢 Base de Datos Central conectada.");

        // 1. Crear mensaje broadcast
        const timestamp = Date.now();
        const nuevoMensaje = await superAdminService.crearMensajeBroadcast({
            titulo: "Mantenimiento Programado " + timestamp,
            contenido: "Actualización de seguridad del sistema central a las 23:00 hs.",
            tipo: "MAINTENANCE",
            negocioId: null,
            creadoPor: "octavio.velo2022@gmail.com"
        });

        console.log("✅ Mensaje Broadcast creado ID:", nuevoMensaje.id, "Título:", nuevoMensaje.titulo);

        // 2. Listar mensajes activos
        const anunciosActivos = await superAdminService.listarAnunciosActivosTenant();
        console.log(`✅ Total anuncios activos para tenants: ${anunciosActivos.length}`);
        
        const miAnuncio = anunciosActivos.find(m => m.id === nuevoMensaje.id);
        if (!miAnuncio) {
            throw new Error("El anuncio recién creado no aparece en la lista de activos.");
        }
        console.log("✅ Anuncio activo verificado correctamente.");

        // 3. Desactivar mensaje
        await superAdminService.desactivarMensaje(nuevoMensaje.id);
        console.log("✅ Mensaje desactivado exitosamente.");

        // 4. Listar logs de seguridad
        const logs = await superAdminService.listarLogsSeguridad();
        console.log(`✅ Total logs de seguridad registrados: ${logs.length}`);

        console.log("\n🎉 PRUEBA DE MENSAJERÍA BROADCAST Y AUDITORÍA FINALIZADA 100% EXITOSA!");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Error en la prueba de broadcast:", err);
        process.exit(1);
    }
}

runTest();
