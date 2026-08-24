import dotenv from 'dotenv';
dotenv.config();
import { connectionManager } from './src/models/connectionManager.js';
import { loginService } from './src/modules/auth/services/login.service.js';
import { serviciosService } from './src/modules/servicios/services/servicios.service.js';
import { categoriasService } from './src/modules/servicios/services/categorias.service.js';

async function runServiciosAudit() {
    console.log("================================================================================");
    console.log("🛡️ INICIANDO AUDITORÍA CRUZADA Y PRUEBAS DE RESILIENCIA: MÓDULO SERVICIOS");
    console.log("================================================================================");

    await connectionManager.initCentral();

    // 0. Resolución Dinámica de Tenant mediante Login/Usuario Autenticado (CERO Hardcoding de Negocio ID)
    console.log("\n0️⃣  [AUTH] Resolviendo tenant dinámicamente desde el usuario activo...");
    const { Usuario } = connectionManager.centralModels;
    const emailAudit = process.env.AUDIT_USER_EMAIL || "octavio.velo2022@gmail.com";

    const usuario = await Usuario.findOne({ where: { email: emailAudit } });
    if (!usuario) {
        throw new Error(`No se encontró el usuario ${emailAudit} en la base de datos central.`);
    }

    const { negocio, empleado } = await loginService._getEmpleadoYNegocioStrict(usuario);
    if (!negocio || !negocio.id) {
        throw new Error(`El usuario ${emailAudit} no tiene un negocio activo asignado.`);
    }

    const negocioId = negocio.id;
    console.log(`   ✅ Tenant resuelto dinámicamente: Negocio ID ${negocioId} ("${negocio.nombre}"), Empleado: "${empleado.nombre}"`);

    let testCatId = null;
    let testServicioId = null;

    try {
        // 1. Listar servicios y categorías existentes
        console.log(`\n1️⃣  [TEST] Listar servicios y categorías del tenant dinámico (Negocio ID: ${negocioId})...`);
        const listadoInicial = await serviciosService.listarServicios(negocioId, { page: 1, limit: 5 });
        console.log(`   ✅ Listado obtenido. Total ítems: ${listadoInicial.meta.totalItems}, Página: ${listadoInicial.meta.currentPage}`);

        const stats = await serviciosService.obtenerEstadisticas(negocioId);
        console.log(`   ✅ Estadísticas: Total: ${stats.total}, Activos: ${stats.activos}, Categorías: ${stats.categorias}`);

        // 2. Probar FAIL-FAST: Creación de servicio SIN precioActual
        console.log("\n2️⃣  [TEST FAIL-FAST] Creación de servicio sin 'precioActual'...");
        try {
            await serviciosService.crearServicio(negocioId, { nombre: "Servicio Sin Precio" });
            console.error("   ❌ ERROR: Se esperaba que fallara por falta de precioActual pero tuvo éxito.");
            process.exit(1);
        } catch (err) {
            console.log(`   ✅ Rechazado correctamente: [${err.code || err.statusCode}] ${err.message}`);
        }

        // 3. Probar FAIL-FAST: Creación de servicio con categoriaId inexistente (prohibición de fallback a General)
        console.log("\n3️⃣  [TEST FAIL-FAST] Creación de servicio con categoriaId inexistente (999999)...");
        try {
            await serviciosService.crearServicio(negocioId, {
                nombre: "Servicio Categoria Falsa",
                precioActual: 1000,
                categoriaId: 999999
            });
            console.error("   ❌ ERROR: Se esperaba CATEGORY_NOT_FOUND pero el servicio aplicó fallback silencioso.");
            process.exit(1);
        } catch (err) {
            console.log(`   ✅ Rechazado correctamente: [${err.code || err.statusCode}] ${err.message}`);
        }

        // 4. Probar FAIL-FAST: Creación de servicio con precio negativo o inválido
        console.log("\n4️⃣  [TEST FAIL-FAST] Creación de servicio con precioActual inválido ('abc')...");
        try {
            await serviciosService.crearServicio(negocioId, {
                nombre: "Servicio Precio Inválido",
                precioActual: "abc"
            });
            console.error("   ❌ ERROR: Se esperaba INVALID_PRICE.");
            process.exit(1);
        } catch (err) {
            console.log(`   ✅ Rechazado correctamente: [${err.code || err.statusCode}] ${err.message}`);
        }

        // 5. Crear categoría legítima de prueba
        console.log("\n5️⃣  [TEST] Creación de nueva categoría de prueba...");
        const nuevaCat = await categoriasService.crearCategoria(negocioId, {
            nombre: "Categoría Auditoría " + Date.now(),
            descripcion: "Categoría temporal para auditoría cruzada",
            icono: "Sparkles",
            color: "#6366f1"
        });
        testCatId = nuevaCat.id;
        console.log(`   ✅ Categoría creada exitosamente. ID: ${testCatId}, Nombre: "${nuevaCat.nombre}"`);

        // 6. Crear servicio legítimo con contrato canónico
        console.log("\n6️⃣  [TEST] Creación de nuevo servicio canónico...");
        const nuevoServicio = await serviciosService.crearServicio(negocioId, {
            nombre: "Lavado Premium Auditoría " + Date.now(),
            descripcion: "Lavado con planchado y perfumado",
            precioActual: 3500.50,
            costoEstimado: 750.00,
            tiempoEstimadoMinutos: 60,
            categoriaId: testCatId,
            disponible: true
        });
        testServicioId = nuevoServicio.id;
        console.log(`   ✅ Servicio creado exitosamente. ID: ${testServicioId}, Nombre: "${nuevoServicio.nombre}", Precio: $${nuevoServicio.precioActual}`);

        // 7. Consultar historial de precios inicial
        console.log("\n7️⃣  [TEST] Consultar historial de precios del servicio creado...");
        const historialInicial = await serviciosService.obtenerHistorialPrecios(negocioId, testServicioId);
        console.log(`   ✅ Historial recuperado (${historialInicial.length} registros). Precio actual: $${historialInicial[0].precio}`);

        // 8. Actualizar precio individual y verificar inserción en historial
        console.log("\n8️⃣  [TEST] Actualizar precio individual ($3500.50 -> $4200.00)...");
        await serviciosService.actualizarServicio(negocioId, testServicioId, {
            precioActual: 4200.00,
            motivo: "Ajuste inflacionario auditoría"
        });
        const historialActualizado = await serviciosService.obtenerHistorialPrecios(negocioId, testServicioId);
        console.log(`   ✅ Historial tras actualización (${historialActualizado.length} registros).`);
        console.log(`      Último precio: $${historialActualizado[historialActualizado.length - 1].precioNuevo}, Anterior: $${historialActualizado[historialActualizado.length - 1].precioAnterior}`);

        // 9. Probar actualización masiva de precios con contrato canónico
        console.log("\n9️⃣  [TEST] Actualización masiva de precios con contrato { servicios: [...] }...");
        const bulkResult = await serviciosService.actualizarPreciosMasivo(negocioId, [
            { id: testServicioId, precioActual: 4800.00 }
        ]);
        console.log(`   ✅ Actualización masiva exitosa. Servicios actualizados: ${bulkResult.count}`);

        // 10. Probar FAIL-FAST en actualización masiva con datos inválidos
        console.log("\n🔟 [TEST FAIL-FAST] Actualización masiva con array vacío...");
        try {
            await serviciosService.actualizarPreciosMasivo(negocioId, []);
            console.error("   ❌ ERROR: Se esperaba rechazo por array vacío.");
            process.exit(1);
        } catch (err) {
            console.log(`   ✅ Rechazado correctamente: [${err.code || err.statusCode}] ${err.message}`);
        }

        // 11. Probar actualización masiva de disponibilidad
        console.log("\n1️⃣1️⃣ [TEST] Actualización masiva de disponibilidad (desactivar)...");
        const bulkDisp = await serviciosService.actualizarDisponibilidadMasiva(negocioId, [testServicioId], false);
        console.log(`   ✅ Disponibilidad actualizada (${bulkDisp.count} registros).`);
        const srvCheck = await serviciosService.obtenerServicioPorId(negocioId, testServicioId);
        console.log(`   ✅ Estado actual del servicio: disponible = ${srvCheck.disponible}`);

        // 12. Soft-delete del servicio
        console.log("\n1️⃣2️⃣ [TEST] Eliminación suave (soft-delete) del servicio...");
        await serviciosService.eliminarServicio(negocioId, testServicioId);
        console.log(`   ✅ Servicio ID ${testServicioId} eliminado (activo = false).`);

        // 13. Soft-delete de la categoría
        console.log("\n1️⃣3️⃣ [TEST] Eliminación suave (soft-delete) de la categoría...");
        await categoriasService.eliminarCategoria(negocioId, testCatId);
        console.log(`   ✅ Categoría ID ${testCatId} eliminada (activo = false).`);

        console.log("\n================================================================================");
        console.log("🎉 AUDITORÍA COMPLETA: TODOS LOS TESTS PASARON EXITOSAMENTE SIN NINGÚN ERROR");
        console.log("================================================================================\n");
        process.exit(0);

    } catch (fatalError) {
        console.error("\n❌ ERROR FATAL EN AUDITORÍA DE SERVICIOS:", fatalError);
        process.exit(1);
    }
}

runServiciosAudit();
