import dotenv from "dotenv";
dotenv.config();

import { serviciosService } from "../src/modules/servicios/services/servicios.service.js";
import { connectionManager } from "../src/models/connectionManager.js";

async function runTest() {
    console.log("🧪 Iniciando prueba de resiliencia: Carga y visualización de imágenes de servicios...");
    await connectionManager.initCentral();
    const negocioId = 13;

    try {
        // 1. Listar servicios existentes
        const listaInicial = await serviciosService.listarServicios(negocioId, { page: 1, limit: 10 });
        console.log(`📋 Servicios recuperados inicialmente para negocio #${negocioId}: ${listaInicial.meta.totalItems}`);

        // 2. Crear o actualizar un servicio con una ruta de imagen de prueba
        const testImageRelPath = "/uploads/productos/test_sample_service.webp";
        
        let servicio = listaInicial.items[0];
        if (servicio) {
            console.log(`🧼 Actualizando foto de servicio existente ID #${servicio.id} ('${servicio.nombre}')...`);
            servicio = await serviciosService.actualizarServicio(negocioId, servicio.id, {}, testImageRelPath);
        } else {
            console.log("🧼 Creando nuevo servicio de prueba con imagen...");
            servicio = await serviciosService.crearServicio(negocioId, {
                nombre: "Servicio Test Imagen " + Date.now(),
                precioActual: 4500,
                descripcion: "Prueba de carga de imagen"
            }, testImageRelPath);
        }

        console.log("✅ Servicio guardado con campo imagenUrl:", servicio.imagenUrl);

        if (!servicio.imagenUrl || servicio.imagenUrl !== testImageRelPath) {
            throw new Error(`El campo imagenUrl no coincide. Obtenido: ${servicio.imagenUrl}`);
        }

        // 3. Volver a consultar la lista y verificar que imagenUrl está presente
        const listaVerificacion = await serviciosService.listarServicios(negocioId, { page: 1, limit: 10 });
        const itemEncontrado = listaVerificacion.items.find(s => s.id === servicio.id);

        if (!itemEncontrado || itemEncontrado.imagenUrl !== testImageRelPath) {
            throw new Error("El servicio consultado en la lista no retornó el campo imagenUrl correctamente.");
        }

        console.log(`🎉 VERIFICACIÓN EXITOSA: La foto '${itemEncontrado.imagenUrl}' se guarda y se recupera perfectamente en la API de servicios.`);
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR en prueba de imágenes de servicios:", err.message);
        process.exit(1);
    }
}

runTest();
