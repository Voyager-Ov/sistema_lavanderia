import "dotenv/config";
import { connectionManager } from "./src/models/connectionManager.js";
import { authService } from "./src/modules/auth/services/auth.service.js";
import { configuracionService } from "./src/modules/configuracion/services/configuracion.service.js";

async function testNeonLive() {
    process.env.NODE_ENV = "development";
    console.log("🚀 Iniciando prueba en vivo sobre la base de datos Neon PostgreSQL...\n");

    try {
        await connectionManager.initCentral();

        const testEmail = `live.${Date.now()}@test.com`;
        const testPassword = "PasswordSegura123";

        console.log(`1️⃣ Registrando nuevo usuario e inquilino (${testEmail})...`);
        const regRes = await authService.register({
            email: testEmail,
            password: testPassword,
            usuarioNombre: "Octavio Velo",
            negocioNombre: "Lavandería Neon Live",
            cuit: "30778899001",
            rol: "ADMIN"
        });
        console.log("  ✅ Registro completado exitosamente.");
        console.log("  📌 Negocio ID generado:", regRes.usuario.negocioId);

        console.log("\n2️⃣ Confirmando cuenta con código de verificación...");
        await authService.verifyEmail({
            email: testEmail,
            code: regRes.tokenConfirmacion
        });
        console.log("  ✅ Correo verificado.");

        console.log("\n3️⃣ Probando Login con credenciales en Neon...");
        const loginRes = await authService.login({
            email: testEmail,
            password: testPassword
        });
        console.log("  ✅ Login exitoso! Token obtenido.");
        console.log("  📌 Datos del usuario autenticado:", loginRes.usuario);

        console.log("\n4️⃣ Obteniendo configuración del negocio desde Neon...");
        const configRes = await configuracionService.getConfiguracion(loginRes.usuario.negocioId);
        console.log("  ✅ Configuración obtenida:", configRes);

        console.log("\n5️⃣ Actualizando branding del negocio en Neon...");
        const updatedConfig = await configuracionService.actualizarConfiguracion(loginRes.usuario.negocioId, {
            colorPrincipal: "#3b82f6",
            colorSecundario: "#1d4ed8",
            direccion: "Calle Falsa 123",
            simboloMoneda: "$"
        });
        console.log("  ✅ Configuración actualizada:", updatedConfig);

        console.log("\n🎉 ¡LA PRUEBA EN VIVO CON NEON POSTGRESQL FUE 100% EXITOSA!");
        process.exit(0);
    } catch (error) {
        console.error("\n🔴 Error en prueba sobre Neon:", error);
        process.exit(1);
    }
}

testNeonLive();
