import { describe, it, expect, beforeAll } from "@jest/globals";
import { connectionManager } from "../../models/connectionManager.js";
import { cajasService } from "../../modules/finanzas/services/cajas.service.js";

describe("Módulo de Cajas, Control de Turnos y Aislamiento Estricto por Usuario", () => {
    const negocioId = 13;
    const empId1 = 101;
    const empId2 = 102;
    let cajaEmp1Id = null;
    let cajaEmp2Id = null;

    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();

        // Limpiar cualquier turno abierto previo de los empleados de prueba
        const cajaEmp1 = await cajasService.obtenerCajaActual(negocioId, empId1);
        if (cajaEmp1 && cajaEmp1.abierta) {
            await cajasService.cerrarCaja(negocioId, cajaEmp1.id, { efectivoReal: 0 }, empId1, true);
        }
        const cajaEmp2 = await cajasService.obtenerCajaActual(negocioId, empId2);
        if (cajaEmp2 && cajaEmp2.abierta) {
            await cajasService.cerrarCaja(negocioId, cajaEmp2.id, { efectivoReal: 0 }, empId2, true);
        }
    });

    it("1. Consulta anónima sin empleadoId debe retornar NULL", async () => {
        const caja = await cajasService.obtenerCajaActual(negocioId, null);
        expect(caja).toBeNull();
    });

    it("2. Debe abrir la caja del Empleado 1 con estado booleano abierta: true", async () => {
        const nuevaCaja = await cajasService.abrirCaja(negocioId, {
            montoInicial: 5000.00,
            empleadoId: empId1,
            observaciones: "Apertura de prueba CI/CD Empleado 1"
        });

        expect(nuevaCaja).toBeDefined();
        expect(nuevaCaja.id).toBeDefined();
        expect(nuevaCaja.abierta).toBe(true);
        expect(nuevaCaja.estado).toBe("ABIERTA");
        expect(nuevaCaja.montoInicial).toBe(5000.00);

        cajaEmp1Id = nuevaCaja.id;
    });

    it("3. Debe rechazar abrir una segunda caja para el Empleado 1 si ya posee una abierta", async () => {
        await expect(
            cajasService.abrirCaja(negocioId, {
                montoInicial: 2000.00,
                empleadoId: empId1
            })
        ).rejects.toThrow("Ya posees un turno de caja abierto actualmente.");
    });

    it("4. Empleado 2 no debe ver la caja abierta del Empleado 1 (Aislamiento de turno)", async () => {
        const cajaEmp2 = await cajasService.obtenerCajaActual(negocioId, empId2);
        expect(cajaEmp2).toBeNull();
    });

    it("5. Debe permitir al Empleado 2 abrir su propia caja independiente en paralelo", async () => {
        const nuevaCajaEmp2 = await cajasService.abrirCaja(negocioId, {
            montoInicial: 8000.00,
            empleadoId: empId2,
            observaciones: "Apertura de prueba CI/CD Empleado 2"
        });

        expect(nuevaCajaEmp2).toBeDefined();
        expect(nuevaCajaEmp2.abierta).toBe(true);
        expect(nuevaCajaEmp2.id).not.toBe(cajaEmp1Id);

        cajaEmp2Id = nuevaCajaEmp2.id;
    });

    it("6. Debe garantizar el AISLAMIENTO DE MOVIMIENTOS E INGRESOS entre las cajas de Empleado 1 y Empleado 2", async () => {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        const { MovimientoCaja } = tenantDb.models;

        // Registrar un movimiento de cobro de $10.000 exclusivamente en la caja del Empleado 1
        await MovimientoCaja.create({
            monto: 10000,
            tipoMovimiento: "Ingreso por Venta",
            observacion: "Cobro Test Empleado 1",
            cajaIdCaja: cajaEmp1Id,
            metodoPagoId: 1
        });

        // Registrar un movimiento de cobro de $15.000 exclusivamente en la caja del Empleado 2
        await MovimientoCaja.create({
            monto: 15000,
            tipoMovimiento: "Ingreso por Venta",
            observacion: "Cobro Test Empleado 2",
            cajaIdCaja: cajaEmp2Id,
            metodoPagoId: 1
        });

        // Consultar la caja actual del Empleado 1
        const cajaActualEmp1 = await cajasService.obtenerCajaActual(negocioId, empId1);
        expect(cajaActualEmp1).toBeDefined();
        expect(cajaActualEmp1.totalIngresosEnVivo).toBe(10000);
        expect(cajaActualEmp1.efectivoEsperadoEnVivo).toBe(15000); // 5000 inicial + 10000 ingreso
        expect(cajaActualEmp1.pagos.length).toBe(1);
        expect(cajaActualEmp1.pagos[0].monto).toBe(10000);

        // Consultar la caja actual del Empleado 2
        const cajaActualEmp2 = await cajasService.obtenerCajaActual(negocioId, empId2);
        expect(cajaActualEmp2).toBeDefined();
        expect(cajaActualEmp2.totalIngresosEnVivo).toBe(15000);
        expect(cajaActualEmp2.efectivoEsperadoEnVivo).toBe(23000); // 8000 inicial + 15000 ingreso
        expect(cajaActualEmp2.pagos.length).toBe(1);
        expect(cajaActualEmp2.pagos[0].monto).toBe(15000);
    });

    it("7. Administrador debe poder listar todas las cajas abiertas del negocio", async () => {
        const abiertas = await cajasService.obtenerCajasAbiertas(negocioId);
        expect(Array.isArray(abiertas)).toBe(true);
        
        const idsAbiertos = abiertas.map(c => c.id);
        expect(idsAbiertos).toContain(cajaEmp1Id);
        expect(idsAbiertos).toContain(cajaEmp2Id);
    });

    it("8. Debe rechazar que Empleado 2 intente cerrar la caja del Empleado 1", async () => {
        await expect(
            cajasService.cerrarCaja(negocioId, cajaEmp1Id, { efectivoReal: 15000.00 }, empId2, false)
        ).rejects.toThrow("No posees permisos para cerrar la caja de otro operador.");
    });

    it("9. Debe cerrar correctamente las cajas manteniendo los montos aislados al finalizar", async () => {
        const cerradaEmp1 = await cajasService.cerrarCaja(negocioId, cajaEmp1Id, { efectivoReal: 15000.00 }, empId1, false);
        expect(cerradaEmp1.abierta).toBe(false);
        expect(cerradaEmp1.estado).toBe("CERRADA");

        const cerradaEmp2 = await cajasService.cerrarCaja(negocioId, cajaEmp2Id, { efectivoReal: 23000.00 }, empId2, false);
        expect(cerradaEmp2.abierta).toBe(false);
        expect(cerradaEmp2.estado).toBe("CERRADA");
    });
});
