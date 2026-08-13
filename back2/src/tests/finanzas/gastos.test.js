import { describe, it, expect, beforeAll } from "@jest/globals";
import { connectionManager } from "../../models/connectionManager.js";
import { gastosService } from "../../modules/gastos/services/gastos.service.js";
import { categoriasGastosService } from "../../modules/gastos/services/categoriasGastos.service.js";
import { anulacionGastosService } from "../../modules/gastos/services/anulacionGastos.service.js";
import { cajasService } from "../../modules/finanzas/services/cajas.service.js";

describe("Módulo de Gastos y Categorías de Egresos", () => {
    const negocioId = 1;
    let categoriaId = null;
    let gastoId = null;

    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();

        // Abrir una caja para asociar movimientos de egreso
        await cajasService.abrirCaja(negocioId, { montoInicial: 10000 });
    });

    it("1. Debe autosembrar y listar las categorías de gastos base", async () => {
        const cats = await categoriasGastosService.obtenerCategorias(negocioId);

        expect(cats).toBeDefined();
        expect(cats.length).toBeGreaterThanOrEqual(5);
        expect(cats.some(c => c.nombre === "Insumos")).toBe(true);
    });

    it("2. Debe crear una categoría de gasto personalizada", async () => {
        const nueva = await categoriasGastosService.crearCategoria(negocioId, {
            nombre: "Publicidad y Marketing",
            descripcion: "Folletos y promociones"
        });

        expect(nueva).toBeDefined();
        expect(nueva.id).toBeDefined();
        expect(nueva.nombre).toBe("Publicidad y Marketing");

        categoriaId = nueva.id;
    });

    it("3. Debe registrar un gasto operativo con egreso en caja", async () => {
        const gasto = await gastosService.registrarGasto(negocioId, {
            montoTotal: 2500,
            categoriaGastoId: categoriaId,
            descripcion: "Impresión de folletos de lavandería",
            proveedor: "Imprenta Central"
        });

        expect(gasto).toBeDefined();
        expect(gasto.id).toBeDefined();
        expect(gasto.montoTotal).toBe(2500);
        expect(gasto.estadoGasto).toBe("Pagado");

        gastoId = gasto.id;
    });

    it("4. Debe listar los gastos registrados", async () => {
        const result = await gastosService.obtenerGastos(negocioId, { limit: 10 });

        expect(result).toBeDefined();
        expect(result.total).toBeGreaterThanOrEqual(1);
        expect(result.items.length).toBeGreaterThanOrEqual(1);
    });

    it("5. Debe anular un gasto correctamente", async () => {
        const result = await anulacionGastosService.anularGasto(negocioId, gastoId);

        expect(result).toBeDefined();
        expect(result.estadoGasto).toBe("Anulado");
    });

    it("6. Debe eliminar una categoría de gasto", async () => {
        const res = await categoriasGastosService.eliminarCategoria(negocioId, categoriaId);
        expect(res.message).toContain("eliminada");
    });
});
