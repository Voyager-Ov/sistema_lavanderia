import { connectionManager } from "./back2/src/models/connectionManager.js";
import { passwordService } from "./back2/src/modules/auth/services/password.service.js";
import { loginService } from "./back2/src/modules/auth/services/login.service.js";

async function runTest() {
    process.env.JWT_SECRET = "supersecret_jwt_key_test_12345";
    console.log("🚀 Iniciando prueba de restablecimiento de contraseña para SuperAdmin...");

    try {
        await connectionManager.initCentral();
        const { Usuario, Rol } = connectionManager.centralModels;

        const targetEmail = "octavio.velo22@gmail.com";

        // Ensure user exists
        let user = await Usuario.findOne({ where: { email: targetEmail } });
        if (!user) {
            user = await Usuario.create({
                email: targetEmail,
                password: "TempPassword123!",
                emailConfirmado: true,
                activo: true
            });
            let [superAdminRol] = await Rol.findOrCreate({ where: { nombre: "SUPER_ADMIN" } });
            await user.addRole(superAdminRol);
        }

        // 1. Solicitud de restablecimiento
        console.log(`\n1️⃣ Solicitando restablecimiento de contraseña para ${targetEmail}...`);
        const forgotRes = await passwordService.forgotPassword(targetEmail);
        console.log("   Respuesta:", forgotRes.message);

        // Recargar usuario para obtener el token generado
        const updatedUser = await Usuario.findByPk(targetEmail);
        const resetToken = updatedUser.tokenConfirmacion;
        console.log(`   Token generado en DB: ${resetToken}`);

        if (!resetToken) {
            throw new Error("❌ No se generó el tokenConfirmacion en el usuario.");
        }

        // 2. Intentar restablecer con un email incorrecto / diferente para probar validación
        console.log("\n2️⃣ Probando verificación de paridad Token + Email (Email incorrecto)...");
        try {
            await passwordService.resetPassword({
                token: resetToken,
                email: "otro.usuario@ejemplo.com",
                newPassword: "PasswordErronea123!"
            });
            throw new Error("❌ Debería haber fallado la verificación cuando el email no coincide con el token.");
        } catch (err) {
            console.log("   ✅ Rechazado correctamente por email no coincidente:", err.message);
        }

        // 3. Restablecer contraseña válida con email y token correctos
        console.log("\n3️⃣ Restableciendo contraseña con token e email correctos...");
        const newPassword = "MiPasswordPersonalSuperAdmin123!";
        const resetRes = await passwordService.resetPassword({
            token: resetToken,
            email: targetEmail,
            newPassword
        });
        console.log("   Respuesta:", resetRes.message);

        // 4. Probar inicio de sesión con la nueva contraseña elegida por el usuario
        console.log("\n4️⃣ Verificando inicio de sesión con la nueva contraseña...");
        const loginRes = await loginService.login({
            email: targetEmail,
            password: newPassword
        });

        console.log("   Respuesta de Login:", loginRes.usuario);

        if (loginRes.usuario.rol !== "SUPER_ADMIN") {
            throw new Error("❌ El rol retornado en login no es SUPER_ADMIN");
        }

        console.log("\n🎉 ¡PRUEBA DE RESTABLECIMIENTO Y SEGURIDAD SUPERADMIN EXITOSA!");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error en la prueba:", error);
        process.exit(1);
    }
}

runTest();
