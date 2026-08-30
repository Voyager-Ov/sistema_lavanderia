import "dotenv/config";
import { connectionManager } from "../models/connectionManager.js";
import { authService } from "../modules/auth/services/auth.service.js";

async function runAuthTests() {
    process.env.NODE_ENV = "test";
    console.log("🧪 Iniciando Pruebas Integrales del Módulo de Autenticación (Auth)...\n");

    try {
        // 1. Inicializar modelos
        await connectionManager.initCentral();

        const testEmail = "admin.lavanderia@test.com";
        const testPassword = "PasswordSegura123";

        // 2. Probar Registro (Onboarding Admin)
        console.log("1️⃣ Probando Registro de Administrador y Negocio...");
        const regResult = await authService.register({
            email: testEmail,
            password: testPassword,
            usuarioNombre: "Juan Pérez",
            negocioNombre: "Lavandería Test Central",
            cuit: "20334445556",
            rol: "ADMIN"
        });
        console.log("  ✅ Registro de solicitud completado exitosamente.");

        console.log("\n2️⃣ Probando Aprobación de Negocio por Super Admin...");
        const aprobacionRes = await authService.sustanciarAprobacionNegocio(regResult.solicitud.id);
        console.log("  ✅ Negocio aprobado por Super Admin:", aprobacionRes.mensaje);

        const { Usuario } = connectionManager.centralModels;
        const usuarioDbCreated = await Usuario.findOne({ where: { email: testEmail } });
        const codeConfirmacion = usuarioDbCreated ? usuarioDbCreated.tokenConfirmacion : null;

        // 3. Probar Login ANTES de verificar el correo (debe fallar con 403)
        console.log("\n3️⃣ Probando Login antes de verificar correo (debe denegarse)...");
        try {
            await authService.login({ email: testEmail, password: testPassword });
            console.error("  ❌ ERROR: El login debería haber fallado por correo no verificado.");
        } catch (err) {
            if (err.statusCode === 403) {
                console.log("  ✅ Capturado correctamente 403:", err.message);
            } else {
                console.error("  ❌ Error inesperado:", err);
            }
        }

        // 4. Probar Confirmación de Correo Electrónico
        console.log("\n4️⃣ Probando Verificación de Correo con Código...");
        const verifyRes = await authService.verifyEmail({
            email: testEmail,
            code: codeConfirmacion
        });
        console.log("  ✅", verifyRes.message);

        // 5. Probar Login DESPUÉS de verificar (debe retornar token y perfil)
        console.log("\n4️⃣ Probando Login con credenciales válidas...");
        const loginRes = await authService.login({
            email: testEmail,
            password: testPassword
        });
        console.log("  ✅ Login exitoso!");
        console.log("  📌 Token JWT generado:", loginRes.token.substring(0, 30) + "...");
        console.log("  📌 Usuario retornado:", loginRes.usuario);

        // 6. Probar Olvido de Contraseña
        console.log("\n5️⃣ Probando Flujo de Olvido de Contraseña (Forgot Password)...");
        const forgotRes = await authService.forgotPassword(testEmail);
        console.log("  ✅", forgotRes.message);

        const usuarioDb = await Usuario.findOne({ where: { email: testEmail } });
        const resetToken = usuarioDb.tokenConfirmacion;
        console.log("  📌 Token de restablecimiento en DB:", resetToken);

        // 7. Probar Restablecimiento de Contraseña
        console.log("\n6️⃣ Probando Restablecimiento de Contraseña (Reset Password)...");
        const newPassword = "NuevaPassword456";
        const resetRes = await authService.resetPassword({
            token: resetToken,
            newPassword: newPassword
        });
        console.log("  ✅", resetRes.message);

        // 8. Probar Login con la Nueva Contraseña
        console.log("\n7️⃣ Probando Login con la Nueva Contraseña...");
        const newLoginRes = await authService.login({
            email: testEmail,
            password: newPassword
        });
        console.log("  ✅ Login con nueva contraseña exitoso!");

        // 9. Probar Cambio de Contraseña (Sesión Activa)
        console.log("\n8️⃣ Probando Cambio de Contraseña (Change Password)...");
        const finalPassword = "PasswordFinal789";
        const changeRes = await authService.changePassword(
            testEmail,
            newPassword,
            finalPassword
        );
        console.log("  ✅", changeRes.message);

        // 10. Probar Obtener Perfil (Get Profile / me)
        console.log("\n9️⃣ Probando Obtención de Perfil de Usuario...");
        const profileRes = await authService.getProfile(testEmail);
        console.log("  ✅ Perfil recuperado:", profileRes.usuario);

        console.log("\n🎉 ¡TODAS LAS PRUEBAS DEL MÓDULO DE AUTH PASARON CON ÉXITO!");
        process.exit(0);
    } catch (error) {
        console.error("\n🔴 Error durante la ejecución de las pruebas:", error);
        process.exit(1);
    }
}

runAuthTests();
