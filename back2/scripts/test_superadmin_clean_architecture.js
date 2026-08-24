import "dotenv/config";
import { connectionManager } from "../src/models/connectionManager.js";
import { registerService } from "../src/modules/auth/services/register.service.js";
import { loginService } from "../src/modules/auth/services/login.service.js";
import { superAdminService } from "../src/modules/superadmin/services/superadmin.service.js";

async function runLiveAudit() {
    console.log("════════════════════════════════════════════════════════════════════════");
    console.log("🚀 INICIANDO AUDITORÍA EN VIVO: ARQUITECTURA LIMPIA Y AISLAMIENTO MULTITENANT");
    console.log("════════════════════════════════════════════════════════════════════════\n");

    let totalTests = 0;
    let passedTests = 0;

    const assert = (condition, message) => {
        totalTests++;
        if (condition) {
            console.log(`  ✅ [PASS] ${message}`);
            passedTests++;
        } else {
            console.error(`  ❌ [FAIL] ${message}`);
        }
    };

    try {
        // 0. Inicializar BD Central
        console.log("📍 PASO 0: Conexión a Base de Datos Central (Neon PG)...");
        await connectionManager.initCentral();
        await connectionManager.centralDb.authenticate();
        assert(true, "Conexión a Neon PostgreSQL autenticada correctamente.");

        const timestamp = Date.now();
        const testEmail = `test_tenant_${timestamp}@lavanderiatest.com`;
        const testPassword = "PasswordSeguro123!";
        const testNombreNegocio = `Lavandería Test ${timestamp}`;
        const testSubdominio = `tenant${timestamp}`;

        // 1. REGISTRO DIFERIDO
        console.log("\n📍 PASO 1: Registro de nueva solicitud de lavandería...");
        const regResult = await registerService.register({
            email: testEmail,
            password: testPassword,
            negocioNombre: testNombreNegocio,
            subdominio: testSubdominio,
            usuarioNombre: "Dueño Test",
            telefono: "1122334455"
        });

        assert(regResult?.solicitud?.id > 0, `Solicitud creada con ID: ${regResult?.solicitud?.id}`);
        assert(regResult?.solicitud?.estado === "PENDIENTE", "Estado de solicitud es estrictamente PENDIENTE.");

        // Verificar que NO existe usuario operativo ni esquema en PG
        const { Usuario, Negocio } = connectionManager.centralModels;
        const usuarioEnCentral = await Usuario.findByPk(testEmail);
        assert(!usuarioEnCentral, "NO se creó usuario en public.usuarios (Zero Schema on Register).");

        // 2. BLOQUEO DE LOGIN PARA SOLICITUD PENDIENTE
        console.log("\n📍 PASO 2: Intento de inicio de sesión con solicitud pendiente...");
        let loginPendingBlocked = false;
        let loginErrorCode = "";
        try {
            await loginService.login({ email: testEmail, password: testPassword });
        } catch (err) {
            loginPendingBlocked = true;
            loginErrorCode = err.code || err.errorCode;
        }

        assert(loginPendingBlocked && loginErrorCode === "SOLICITUD_PENDIENTE", `Login bloqueado correctamente con código 403 (${loginErrorCode}).`);

        // 3. HEALTH CHECK & DASHBOARD DE SUPERADMIN
        console.log("\n📍 PASO 3: Diagnóstico de salud y métricas de SuperAdmin...");
        const health = await superAdminService.runHealthCheck();
        assert(health.status === "OK" && health.neonStatus === "CONNECTED" && health.dbLatency >= 0, `Health check OK: latencia ${health.dbLatency}ms contra Neon.`);

        const dashboard = await superAdminService.getDashboard();
        assert(dashboard.stats.solicitudesPendientes > 0, `Dashboard detecta solicitudes pendientes: ${dashboard.stats.solicitudesPendientes}`);

        // 4. APROBACIÓN POR SUPERADMIN Y PROVISIÓN ATÓMICA
        console.log("\n📍 PASO 4: Aprobación por SuperAdmin y provisión de esquema aislado...");
        const solicitudId = regResult.solicitud.id;
        const aprobacion = await registerService.sustanciarAprobacionNegocio(solicitudId, "octavio.velo2022@gmail.com");

        const nuevoNegocioId = aprobacion.negocio.id;
        assert(nuevoNegocioId > 0, `Negocio provisionado con ID: ${nuevoNegocioId}`);
        assert(aprobacion.solicitud.estado === "APROBADO", "Solicitud actualizada a estado APROBADO.");

        const usuarioAprobado = await Usuario.findByPk(testEmail);
        assert(usuarioAprobado && usuarioAprobado.negocioId === nuevoNegocioId, `Usuario central creado con negocioId: ${usuarioAprobado?.negocioId}`);

        // 5. PRIMER LOGIN CON CUENTA APROBADA
        console.log("\n📍 PASO 5: Inicio de sesión con el nuevo negocio aprobado...");
        const loginApproved = await loginService.login({ email: testEmail, password: testPassword });
        assert(loginApproved?.token && loginApproved?.usuario?.negocioId === nuevoNegocioId, `Login exitoso vinculado exclusivamente a negocioId: ${loginApproved?.usuario?.negocioId}`);

        // 6. VERIFICACIÓN DE AISLAMIENTO Y ESTADO 0
        console.log("\n📍 PASO 6: Verificación de tablas limpias en 0 en el nuevo esquema...");
        const tenantDb = await connectionManager.getTenantDb(nuevoNegocioId);
        const totalPedidos = await tenantDb.models.Pedido.count();
        const totalClientes = await tenantDb.models.Cliente.count();
        const totalGastos = await tenantDb.models.Gasto.count();

        assert(totalPedidos === 0, `Total pedidos en nuevo tenant: ${totalPedidos} (Esperado: 0)`);
        assert(totalClientes === 0, `Total clientes en nuevo tenant: ${totalClientes} (Esperado: 0)`);
        assert(totalGastos === 0, `Total gastos en nuevo tenant: ${totalGastos} (Esperado: 0)`);

        // 7. CORTE Y REACTIVACIÓN DE SERVICIO
        console.log("\n📍 PASO 7: Prueba de suspensión de servicio (Corte de Servicio)...");
        await superAdminService.toggleEstadoNegocio(nuevoNegocioId, false);
        
        let loginSuspendedBlocked = false;
        let suspendedCode = "";
        try {
            await loginService.login({ email: testEmail, password: testPassword });
        } catch (err) {
            loginSuspendedBlocked = true;
            suspendedCode = err.code || err.errorCode;
        }

        assert(loginSuspendedBlocked && suspendedCode === "BUSINESS_SUSPENDED", `Acceso suspendido bloqueado con código 403 (${suspendedCode}).`);

        // Reactivar
        await superAdminService.toggleEstadoNegocio(nuevoNegocioId, true);
        const loginRestored = await loginService.login({ email: testEmail, password: testPassword });
        assert(loginRestored?.token !== undefined, "Acceso restablecido exitosamente tras reactivación.");

        console.log("\n════════════════════════════════════════════════════════════════════════");
        console.log(`🏁 RESULTADO AUDITORÍA: ${passedTests}/${totalTests} PRUEBAS COMPLETADAS CON ÉXITO.`);
        console.log("════════════════════════════════════════════════════════════════════════\n");

        process.exit(passedTests === totalTests ? 0 : 1);
    } catch (error) {
        console.error("\n💥 Error fatal durante la auditoría:", error);
        process.exit(1);
    }
}

runLiveAudit();
