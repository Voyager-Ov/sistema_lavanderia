import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectionManager } from "../../models/connectionManager.js";
import { authService, loginService, registerService, verifyEmailService, passwordService, profileService } from "../../modules/auth/services/auth.service.js";

async function runAuthVerification() {
    process.env.NODE_ENV = "development";
    console.log("==========================================================");
    console.log("🛡️ INICIANDO TEST EXTRA DE VERIFICACIÓN BACKEND - MÓDULO AUTH");
    console.log("==========================================================");

    let testEmail = `auth.test.${Date.now()}@lavanderia.com`;
    let testPassword = "PasswordSegura123!";
    let newPassword = "NuevaPasswordSegura456!";
    let negocioId = 13;

    try {
        console.log("\n[PASO 1] Inicializando conexión a DB...");
        await connectionManager.initCentral();
        console.log("✅ Conexión inicializada.");

        // TEST 1: Fail-Fast sin email en login
        console.log("\n[PASO 2] Test 1: Probando login sin email (Fail-Fast 400)...");
        try {
            await loginService.login({ email: "", password: testPassword });
            console.error("❌ ERROR: Login debió fallar sin email");
            process.exit(1);
        } catch (err) {
            if (err.code === "MISSING_EMAIL") {
                console.log("  ✅ RESULTADO: Rechazado correctamente con 400 MISSING_EMAIL -> Message:", err.message);
            } else {
                console.error("❌ ERROR inesperado:", err);
                process.exit(1);
            }
        }

        // TEST 2: Fail-Fast sin password en login
        console.log("\n[PASO 3] Test 2: Probando login sin contraseña (Fail-Fast 400)...");
        try {
            await loginService.login({ email: testEmail, password: "" });
            console.error("❌ ERROR: Login debió fallar sin contraseña");
            process.exit(1);
        } catch (err) {
            if (err.code === "MISSING_PASSWORD") {
                console.log("  ✅ RESULTADO: Rechazado correctamente con 400 MISSING_PASSWORD -> Message:", err.message);
            } else {
                console.error("❌ ERROR inesperado:", err);
                process.exit(1);
            }
        }

        // TEST 3: Intentar login con email inexistente
        console.log("\n[PASO 4] Test 3: Probando login con usuario inexistente...");
        try {
            await loginService.login({ email: "inexistente.usuario.99@lavanderia.com", password: testPassword });
            console.error("❌ ERROR: Login debió fallar por usuario inexistente");
            process.exit(1);
        } catch (err) {
            if (err.code === "INVALID_CREDENTIALS") {
                console.log("  ✅ RESULTADO: Rechazado correctamente con 401 INVALID_CREDENTIALS -> Message:", err.message);
            } else {
                console.error("❌ ERROR inesperado:", err);
                process.exit(1);
            }
        }

        // TEST 4: Registro de nuevo usuario
        console.log("\n[PASO 5] Test 4: Registrando usuario de prueba:", testEmail, "...");
        const regRes = await registerService.register({
            email: testEmail,
            password: testPassword,
            usuarioNombre: "Tester Auth",
            negocioNombre: "Lavanderia Test Auth",
            subdominio: `testauth${Date.now()}`
        });
        console.log("  ✅ RESULTADO: Registro enviado exitosamente -> Solicitud ID:", regRes.solicitud.id);

        // TEST 5: Aprobación de la solicitud por SuperAdmin
        console.log("\n[PASO 6] Test 5: Aprobando solicitud de registro...");
        const sustanciarRes = await registerService.sustanciarAprobacionNegocio(regRes.solicitud.id);
        negocioId = sustanciarRes.negocio.id;
        console.log("  ✅ RESULTADO: Negocio y usuario aprobados -> Tenant Negocio ID:", negocioId);

        // TEST 6: Verificación de Email con tokenConfirmacion canónico
        console.log("\n[PASO 7] Test 6: Verificando email con tokenConfirmacion...");
        const { Usuario } = connectionManager.centralModels;
        const usuarioDb = await Usuario.findByPk(testEmail);
        const tokenConf = usuarioDb.tokenConfirmacion;

        const verifyRes = await verifyEmailService.verifyEmail({
            email: testEmail,
            tokenConfirmacion: tokenConf
        });
        console.log("  ✅ RESULTADO: Email verificado -> Message:", verifyRes.message);

        // TEST 7: Login exitoso con usuario verificado
        console.log("\n[PASO 8] Test 7: Realizando login exitoso con usuario verificado...");
        const loginRes = await loginService.login({
            email: testEmail,
            password: testPassword
        });
        console.log("  ✅ RESULTADO: Login exitoso -> Token emitido.");
        console.log("  📌 Datos Usuario:", JSON.stringify(loginRes.usuario));

        // TEST 8: Requisitos de Perfil /me
        console.log("\n[PASO 9] Test 8: Solicitando perfil de usuario (/me)...");
        const profileRes = await profileService.getProfile(testEmail);
        console.log("  ✅ RESULTADO: Perfil obtenido ->", JSON.stringify(profileRes.usuario));

        // TEST 9: Restablecimiento de contraseña con tokenConfirmacion y newPassword
        console.log("\n[PASO 10] Test 9: Restableciendo contraseña...");
        const resetToken = "reset_token_hex_999";
        await Usuario.update({
            tokenConfirmacion: resetToken,
            tokenConfirmacionExpires: new Date(Date.now() + 3600000)
        }, { where: { email: testEmail } });

        const resetRes = await passwordService.resetPassword({
            email: testEmail,
            tokenConfirmacion: resetToken,
            newPassword: newPassword
        });
        console.log("  ✅ RESULTADO: Contraseña restablecida -> Message:", resetRes.message);

        // TEST 10: Verificar login con la nueva contraseña
        console.log("\n[PASO 11] Test 10: Login con la NUEVA contraseña...");
        const loginNewRes = await loginService.login({
            email: testEmail,
            password: newPassword
        });
        console.log("  ✅ RESULTADO: Login exitoso con nueva clave -> Tenant ID:", loginNewRes.usuario.negocioId);

        // TEST 11: Limpieza de datos de prueba
        console.log("\n[PASO 12] Limpiando usuario de prueba...");
        await Usuario.destroy({ where: { email: testEmail } });
        console.log("  ✅ Usuario eliminado.");

        console.log("\n==========================================================");
        console.log("🎉 VERIFICACIÓN BACKEND AUTH COMPLETADA 100% EXITOSAMENTE!");
        console.log("==========================================================");
        process.exit(0);

    } catch (error) {
        console.error("\n💥 FALLO EN LA VERIFICACIÓN DE AUTH:", error);
        process.exit(1);
    }
}

runAuthVerification();
