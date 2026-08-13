import { describe, it, expect, beforeAll } from "@jest/globals";
import { connectionManager } from "../../models/connectionManager.js";
import { empleadosService } from "../../modules/rrhh/services/empleados.service.js";
import { estadoEmpleadosService } from "../../modules/rrhh/services/estadoEmpleados.service.js";
import { desempenoEmpleadosService } from "../../modules/rrhh/services/desempenoEmpleados.service.js";

describe("Módulo de Empleados y Recursos Humanos (RRHH)", () => {
    const negocioId = 1;
    let empleadoId = null;

    beforeAll(async () => {
        process.env.NODE_ENV = "test";
        await connectionManager.initCentral();
    });

    it("1. Debe dar de alta un nuevo empleado", async () => {
        const nuevo = await empleadosService.crearEmpleado(negocioId, {
            nombre: "Juan Perez Cajero",
            email: "juan.cajero@lavanderia.com",
            rol: "empleado",
            sueldoBase: 350000,
            horasSemanalesObjetivo: 44
        });

        expect(nuevo).toBeDefined();
        expect(nuevo.id).toBeDefined();
        expect(nuevo.nombre).toBe("Juan Perez Cajero");
        expect(nuevo.activo).toBe(true);

        empleadoId = nuevo.id;
    });

    it("2. Debe listar los empleados del negocio de forma paginada", async () => {
        const result = await empleadosService.obtenerEmpleados(negocioId, { page: 1, limit: 10 });

        expect(result).toBeDefined();
        expect(result.items.length).toBeGreaterThanOrEqual(1);
        expect(result.meta.totalItems).toBeGreaterThanOrEqual(1);
    });

    it("3. Debe modificar los datos de legajo de un empleado", async () => {
        const actualizado = await empleadosService.actualizarEmpleado(negocioId, empleadoId, {
            nombre: "Juan Perez Cajero Senior",
            sueldoBase: 400000
        });

        expect(actualizado.nombre).toBe("Juan Perez Cajero Senior");
        expect(actualizado.sueldoBase).toBe(400000);
    });

    it("4. Debe cambiar el estado activo/inactivo de un empleado", async () => {
        const inhabilitado = await estadoEmpleadosService.cambiarEstadoEmpleado(negocioId, empleadoId, false);
        expect(inhabilitado.activo).toBe(false);

        const rehabilitado = await estadoEmpleadosService.cambiarEstadoEmpleado(negocioId, empleadoId, true);
        expect(rehabilitado.activo).toBe(true);
    });

    it("5. Debe auditar las métricas de desempeño de un empleado", async () => {
        const metricas = await desempenoEmpleadosService.obtenerMetricasEmpleado(negocioId, empleadoId);

        expect(metricas).toBeDefined();
        expect(metricas.empleadoId).toBe(empleadoId);
        expect(metricas.cajasAtendidas).toBeDefined();
    });
});
