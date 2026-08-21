import dotenv from "dotenv";
dotenv.config();
import { connectionManager } from "./back2/src/models/connectionManager.js";
import { registerService } from "./back2/src/modules/auth/services/register.service.js";
import { superAdminService } from "./back2/src/modules/superadmin/services/superadmin.service.js";
import fs from "fs";
import path from "path";

async function runTest() {
    console.log("🚀 Iniciando prueba de integración de Super Admin y Gestión de Negocios...");

    try {
        // 1. Inicializar BD central
        await connectionManager.initCentral();
        console.log("✅ Conexión Central inicializada.");

        const timestamp = Date.now();
        const testEmail = `test.solicitud.${timestamp}@ejemplo.com`;
        const negocioNombre = `Lavandería Test ${timestamp}`;

        // 2. Probar creación de solicitud de registro
        console.log("\n1️⃣ Creando Solicitud de Negocio (Registro de Usuario)...");
        const resRegistro = await registerService.register({
            nombre: "Juan Perez Test",
            email: testEmail,
            password: "PasswordSuperSegura123!",
            negocioNombre: negocioNombre,
            cuit: "20304050609",
            telefono: "1122334455"
        });
        console.log("   Resultado:", resRegistro.solicitud);

        if (resRegistro.solicitud.estado !== "PENDIENTE") {
            throw new Error("❌ La solicitud de registro no se guardó como PENDIENTE");
        }

        // 3. Listar solicitudes desde Super Admin Service
        console.log("\n2️⃣ Consultando solicitudes pendientes en Super Admin Service...");
        const solicitudesPendientes = await superAdminService.listarSolicitudes("PENDIENTE");
        const solicitudCreada = solicitudesPendientes.find(s => s.emailSolicitante === testEmail);
        
        if (!solicitudCreada) {
            throw new Error("❌ La solicitud creada no fue encontrada en la lista de solicitudes del Super Admin");
        }
        console.log(`   ✅ Solicitud #${solicitudCreada.id} verificada en estado PENDIENTE.`);

        // 4. Aprobar la solicitud desde Super Admin
        console.log(`\n3️⃣ Aprobando Solicitud #${solicitudCreada.id} desde Super Admin...`);
        const resAprobacion = await superAdminService.aprobarSolicitud(solicitudCreada.id, "octavio.velo2022@gmail.com");
        console.log("   Negocio Aprobado ID:", resAprobacion.negocio.id);
        console.log("   Estado de la Solicitud:", resAprobacion.solicitud.estado);

        if (resAprobacion.solicitud.estado !== "APROBADO") {
            throw new Error("❌ La solicitud no cambió a estado APROBADO.");
        }

        // 5. Consultar métricas de almacenamiento del negocio
        console.log("\n4️⃣ Verificando métricas de almacenamiento y cuotas...");
        const metricas = await superAdminService.getNegocioAlmacenamiento(resAprobacion.negocio.id);
        console.log("   Métricas iniciales:", metricas);

        if (metricas.maxImagenes !== 50 || metricas.maxStorageGB !== 1.0) {
            throw new Error("❌ Los valores por defecto de cuotas de imágenes/almacenamiento no coinciden.");
        }

        // 6. Actualizar límites de cuotas
        console.log("\n5️⃣ Actualizando límites de cuotas del negocio...");
        const negocioActualizado = await superAdminService.updateNegocioLimites(resAprobacion.negocio.id, {
            maxImagenes: 120,
            maxStorageGB: 2.5
        });
        console.log(`   Nuevos Límites -> Fotos: ${negocioActualizado.maxImagenes}, GB: ${negocioActualizado.maxStorageGB}`);

        if (negocioActualizado.maxImagenes !== 120 || negocioActualizado.maxStorageGB !== 2.5) {
            throw new Error("❌ No se actualizaron correctamente las cuotas del negocio.");
        }

        // 7. Simular subida y eliminación de una imagen de prueba
        console.log("\n6️⃣ Probando gestión de imágenes del tenant...");
        const tenantUploadFolder = path.join(process.cwd(), "public", "uploads", String(resAprobacion.negocio.id));
        if (!fs.existsSync(tenantUploadFolder)) {
            fs.mkdirSync(tenantUploadFolder, { recursive: true });
        }
        const dummyImgPath = path.join(tenantUploadFolder, "test_logo.png");
        fs.writeFileSync(dummyImgPath, "dummy image content test 12345");

        const imagenesAntes = await superAdminService.listarImagenesTenant(resAprobacion.negocio.id);
        console.log(`   Imágenes encontradas: ${imagenesAntes.length}`);

        if (imagenesAntes.length === 0) {
            throw new Error("❌ No se detectó la imagen de prueba en la carpeta del tenant.");
        }

        // Eliminar la imagen
        const resBorrado = await superAdminService.eliminarImagenesTenant(resAprobacion.negocio.id, [imagenesAntes[0].id]);
        console.log("   Resultado borrado:", resBorrado.mensaje);

        const imagenesDespues = await superAdminService.listarImagenesTenant(resAprobacion.negocio.id);
        if (imagenesDespues.length !== 0) {
            throw new Error("❌ La imagen no fue eliminada del sistema de archivos.");
        }

        console.log("\n🎉 ¡TODAS LAS PRUEBAS DEL MÓDULO SUPER ADMIN SE EJECUTARON CON ÉXITO!");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error en la prueba de integración:", error);
        process.exit(1);
    }
}

runTest();
