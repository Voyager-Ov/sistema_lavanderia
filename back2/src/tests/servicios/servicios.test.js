import { describe, it, expect, beforeAll } from "@jest/globals";
import { connectionManager } from "../../models/connectionManager.js";
import { serviciosService } from "../../modules/servicios/services/servicios.service.js";

describe("Módulo de Servicios y Categorías", () => {
    const negocioId = 1;
    let categoriaId = null;
    let servicioId = null;

    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();
    });

    it("1. Debe crear una nueva categoría de servicios", async () => {
        const categoria = await serviciosService.crearCategoria(negocioId, {
            nombre: "Lavado General Test",
            descripcion: "Categoría para prendas comunes",
            icono: "Shirt",
            color: "#2563eb"
        });

        expect(categoria).toBeDefined();
        expect(categoria.id).toBeDefined();
        expect(categoria.nombre).toBe("Lavado General Test");

        categoriaId = categoria.id;
    });

    it("2. Debe listar las categorías activas del negocio", async () => {
        const result = await serviciosService.listarCategorias(negocioId);

        expect(result.items).toBeDefined();
        expect(Array.isArray(result.items)).toBe(true);
        expect(result.items.length).toBeGreaterThan(0);
    });

    it("3. Debe crear un nuevo servicio vinculado a la categoría", async () => {
        const servicio = await serviciosService.crearServicio(negocioId, {
            nombre: "Lavado de Acolchado 2 Plazas Test",
            descripcion: "Lavado profundo y secado",
            precioActual: 8500.50,
            costoEstimado: 1200.00,
            tiempoEstimadoMinutos: 120,
            disponible: true,
            categoriaId
        });

        expect(servicio).toBeDefined();
        expect(servicio.id).toBeDefined();
        expect(servicio.nombre).toBe("Lavado de Acolchado 2 Plazas Test");
        expect(parseFloat(servicio.precioActual)).toBe(8500.50);
        expect(servicio.categoria).toBeDefined();
        expect(servicio.categoria.id).toBe(categoriaId);

        servicioId = servicio.id;
    });

    it("4. Debe listar servicios con paginación y filtros", async () => {
        const result = await serviciosService.listarServicios(negocioId, {
            page: 1,
            limit: 10,
            search: "Acolchado",
            categoriaId: categoriaId.toString(),
            disponible: "true"
        });

        expect(result.items).toBeDefined();
        expect(result.items.length).toBeGreaterThan(0);
        expect(result.meta.totalItems).toBeGreaterThan(0);
    });

    it("5. Debe obtener el detalle de un servicio por ID", async () => {
        const servicio = await serviciosService.obtenerServicioPorId(negocioId, servicioId);

        expect(servicio).toBeDefined();
        expect(servicio.id).toBe(servicioId);
        expect(servicio.nombre).toBe("Lavado de Acolchado 2 Plazas Test");
    });

    it("6. Debe actualizar los datos y precio del servicio", async () => {
        const actualizado = await serviciosService.actualizarServicio(negocioId, servicioId, {
            nombre: "Lavado de Acolchado 2 Plazas Premium",
            precioActual: 9500.00,
            costoEstimado: 1500.00
        });

        expect(actualizado.nombre).toBe("Lavado de Acolchado 2 Plazas Premium");
        expect(parseFloat(actualizado.precioActual)).toBe(9500.00);
    });

    it("7. Debe calcular las estadísticas del módulo de servicios", async () => {
        const stats = await serviciosService.obtenerEstadisticas(negocioId);

        expect(stats).toBeDefined();
        expect(stats.total).toBeGreaterThan(0);
        expect(stats.activos).toBeGreaterThan(0);
        expect(stats.categorias).toBeGreaterThan(0);
        expect(stats.masSolicitado).toBeDefined();
    });

    it("8. Debe eliminar (soft-delete) un servicio", async () => {
        const res = await serviciosService.eliminarServicio(negocioId, servicioId);
        expect(res.message).toContain("correctamente");

        await expect(serviciosService.obtenerServicioPorId(negocioId, servicioId))
            .rejects
            .toThrow("Servicio no encontrado");
    });
});
