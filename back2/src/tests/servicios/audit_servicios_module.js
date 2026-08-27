import "dotenv/config";
import { connectionManager } from "../../models/connectionManager.js";
import { serviciosService } from "../../modules/servicios/services/servicios.service.js";
import { categoriasService } from "../../modules/servicios/services/categorias.service.js";
import { AppError } from "../../utils/appError.js";

async function runServiciosAudit() {
    console.log("🚀 INICIANDO AUDITORÍA Y PRUEBAS EN VIVO DEL MÓDULO DE SERVICIOS Y CATEGORÍAS...\n");

    console.log("[TEST 1] Inicializando conexión central de DB (Neon DB)...");
    await connectionManager.initCentral();
    const negocioId = 13; // Negocio activo de prueba
    console.log("✅ Conexión inicializada con éxito.\n");

    console.log("[TEST 2] Verificando Fail-Fast al omitir negocioId en serviciosService...");
    try {
        await serviciosService.listarServicios(null);
        console.error("❌ FALLO: Debería haber rechazado negocioId nulo.");
        process.exit(1);
    } catch (err) {
        if (err instanceof AppError && err.code === "MISSING_TENANT_ID") {
            console.log("✅ Correcto: Lanzó AppError 400 (MISSING_TENANT_ID).\n");
        } else {
            console.error("❌ FALLO: Lanzó error inesperado:", err);
            process.exit(1);
        }
    }

    console.log("[TEST 3] Verificando Fail-Fast en crearServicio con precio negativo...");
    try {
        await serviciosService.crearServicio(negocioId, { nombre: "Servicio Audit", precioActual: -100 });
        console.error("❌ FALLO: Debería haber rechazado precio negativo.");
        process.exit(1);
    } catch (err) {
        if (err instanceof AppError && err.code === "INVALID_PRICE") {
            console.log("✅ Correcto: Lanzó AppError 400 (INVALID_PRICE).\n");
        } else {
            console.error("❌ FALLO: Lanzó error inesperado:", err);
            process.exit(1);
        }
    }

    console.log("[TEST 4] Creando categoría de prueba atómicamente...");
    const nuevaCat = await categoriasService.crearCategoria(negocioId, {
        nombre: `Categoría Audit ${Date.now()}`,
        descripcion: "Categoría de auditoría en vivo",
        color: "#10b981"
    });
    console.log(`✅ Categoría creada exitosamente ID: ${nuevaCat.id} (Nombre: ${nuevaCat.nombre}).\n`);

    console.log("[TEST 5] Creando servicio de prueba atómicamente con historial de precio inicial...");
    const nuevoServicio = await serviciosService.crearServicio(negocioId, {
        nombre: `Lavado Especial Audit ${Date.now()}`,
        descripcion: "Servicio creado para auditoría en vivo",
        precioActual: 2500,
        categoriaId: nuevaCat.id,
        tiempoEstimadoMinutos: 45
    });
    console.log(`✅ Servicio creado exitosamente ID: ${nuevoServicio.id} (Precio: $${nuevoServicio.precioActual}).\n`);

    console.log("[TEST 6] Consultando historial de precios del servicio recién creado...");
    const historialInicial = await serviciosService.obtenerHistorialPrecios(negocioId, nuevoServicio.id);
    if (!Array.isArray(historialInicial) || historialInicial.length === 0) {
        console.error("❌ FALLO: No se registró el historial de precio inicial.");
        process.exit(1);
    }
    console.log(`✅ Historial de precio inicial verificado en DB con ${historialInicial.length} registro(s).\n`);

    console.log("[TEST 7] Actualizando precio del servicio atómicamente...");
    const servicioActualizado = await serviciosService.actualizarServicio(negocioId, nuevoServicio.id, {
        precioActual: 3000,
        motivo: "Ajuste por inflación de prueba"
    });
    if (Number(servicioActualizado.precioActual) !== 3000) {
        console.error("❌ FALLO: El precio no se actualizó a 3000.");
        process.exit(1);
    }
    console.log("✅ Precio de servicio actualizado a $3000 atómicamente.\n");

    console.log("[TEST 8] Ejecutando actualización masiva de precios atómica...");
    const bulkRes = await serviciosService.actualizarPreciosMasivo(negocioId, [
        { id: nuevoServicio.id, precioActual: 3500 }
    ]);
    if (bulkRes.count !== 1) {
        console.error("❌ FALLO: La actualización masiva no afectó al servicio.");
        process.exit(1);
    }
    console.log("✅ Actualización masiva de precios validada con éxito.\n");

    console.log("[TEST 9] Realizando borrado lógico (soft-delete) del servicio y la categoría...");
    await serviciosService.eliminarServicio(negocioId, nuevoServicio.id);
    await categoriasService.eliminarCategoria(negocioId, nuevaCat.id);
    console.log("✅ Borrado lógico de servicio y categoría ejecutado correctamente.\n");

    console.log("[TEST 10] Verificando que el servicio eliminado ya no aparece en el listado activo...");
    const listado = await serviciosService.listarServicios(negocioId, { limit: 100 });
    const hallado = listado.items.find(s => s.id === nuevoServicio.id);
    if (hallado) {
        console.error("❌ FALLO: El servicio eliminado aún figura activo.");
        process.exit(1);
    }
    console.log("✅ Verificación de borrado lógico confirmada en DB.\n");

    console.log("🎉 AUDITORÍA COMPLETA Y PRUEBAS DE INTEGRACIÓN DEL MÓDULO DE SERVICIOS EXITOSAS (100% PASS)!");
    process.exit(0);
}

runServiciosAudit().catch((err) => {
    console.error("💥 FALLO EN LA AUDITORÍA DE SERVICIOS:", err);
    process.exit(1);
});
