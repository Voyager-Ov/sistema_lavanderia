import { describe, it, expect, beforeAll } from "@jest/globals";
import { connectionManager } from "../../models/connectionManager.js";
import { cajasService } from "../../modules/finanzas/services/cajas.service.js";

describe("Módulo de Cajas y Control de Turnos", () => {
    const negocioId = 1;
    let cajaId = null;

    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();
    });

    it("1. Debe obtener la caja actual o crear una por defecto", async () => {
        const caja = await cajasService.obtenerCajaActual(negocioId);

        expect(caja).toBeDefined();
        expect(caja.id).toBeDefined();
        expect(caja.estado).toBe("ABIERTA");

        cajaId = caja.id;
    });

    it("2. Debe calcular los saldos esperados de la caja actual", async () => {
        const caja = await cajasService.obtenerCajaPorId(negocioId, cajaId);

        expect(caja).toBeDefined();
        expect(caja.efectivoEsperadoEnVivo).toBeDefined();
    });

    it("3. Debe cerrar el turno de caja", async () => {
        const cerrada = await cajasService.cerrarCaja(negocioId, cajaId, {
            efectivoReal: 15000.00
        });

        expect(cerrada.estado).toBe("CERRADA");
        expect(cerrada.efectivoReal).toBe(15000.00);
    });

    it("4. Debe abrir un nuevo turno de caja", async () => {
        const nuevaCaja = await cajasService.abrirCaja(negocioId, {
            montoInicial: 5000.00
        });

        expect(nuevaCaja).toBeDefined();
        expect(nuevaCaja.montoInicial).toBe(5000.00);
        expect(nuevaCaja.estado).toBe("ABIERTA");
    });
});
