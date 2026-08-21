import dotenv from "dotenv";
dotenv.config();
import { connectionManager } from "../src/models/connectionManager.js";
import { registerService } from "../src/modules/auth/services/register.service.js";
import { superAdminService } from "../src/modules/superadmin/services/superadmin.service.js";

async function runTest() {
    console.log("🚀 Iniciando prueba de integración de Super Admin y Gestión de Negocios...");

    try {
        // 1. Inicializar BD central
        await connectionManager.initCentral();
        console.log("✅ Conexión Central inicializada.");

        const timestamp = Date.now();
        const email = `test.solicitante.${timestamp}@example.com`;
        const testData = {
            nombreSolicitante: "Test Solicitante " + timestamp,
            nombre: "Test Solicitante " + timestamp,
            emailSolicitante: email,
            email: email,
            password: "Password123!",
            negocioNombre: "Negocio Test " + timestamp,
            nombreNegocio: "Negocio Test " + timestamp,
            cuit: "20" + String(timestamp).slice(-9),
            razonSocial: "Razon Social " + timestamp,
            subdominio: "negociotest" + timestamp
        };

        // 2. Probar creación diferida de solicitud de negocio
        console.log("\n1️⃣ Registrando nueva solicitud de negocio diferida...");
        const regResult = await registerService.register(testData);
        console.log("   Respuesta de registro:", regResult.mensaje);
        console.log("   Estado:", regResult.solicitud?.estado);
        
        if (!regResult.solicitud || regResult.solicitud.estado !== "PENDIENTE") {
            throw new Error("El estado del registro diferido debe ser PENDIENTE.");
        }

        // 3. Listar solicitudes en SuperAdmin
        console.log("\n2️⃣ Consultando solicitudes en el portal SuperAdmin...");
        const solicitudes = await superAdminService.listarSolicitudes();
        console.log(`   Total solicitudes encontradas: ${solicitudes.length}`);

        const miSolicitud = solicitudes.find(s => s.emailSolicitante === email);
        if (!miSolicitud) {
            throw new Error("No se encontró la solicitud recién creada.");
        }
        console.log(`   Solicitud ID #${miSolicitud.id} encontrada con estado: ${miSolicitud.estado}`);

        // 4. Aprobar la solicitud desde SuperAdmin
        console.log("\n3️⃣ Aprobando solicitud y aprovisionando negocio/schema...");
        const aprobacionResult = await superAdminService.aprobarSolicitud(miSolicitud.id);
        const negocioId = aprobacionResult.negocio.id;
        console.log("   Negocio ID Creado:", negocioId);

        // 5. Verificar y ajustar límites de almacenamiento
        console.log("\n4️⃣ Verificando almacenamiento y actualizando cuotas de negocio...");
        const almInicial = await superAdminService.getNegocioAlmacenamiento(negocioId);
        console.log("   Almacenamiento inicial:", JSON.stringify(almInicial));

        const nuevosLimites = await superAdminService.updateNegocioLimites(negocioId, {
            maxImagenes: 80,
            maxStorageGB: 2.5
        });
        console.log("   Cuotas actualizadas exitosamente:", JSON.stringify(nuevosLimites));

        if (nuevosLimites.maxImagenes !== 80 || nuevosLimites.maxStorageGB !== 2.5) {
            throw new Error("Las cuotas no coinciden con los límites asignados.");
        }

        console.log("\n🎉 PRUEBA DE INTEGRACIÓN DE SUPER ADMIN COMPLETADA CON ÉXITO 100%.");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Error en la prueba de integración:", err);
        process.exit(1);
    }
}

runTest();
