import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class DesempenoEmpleadosService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    async obtenerMetricasEmpleado(negocioId, id) {
        if (!negocioId) throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        const { Empleado, Caja, Pedido } = await this._getModels(negocioId);

        const empleado = await Empleado.findByPk(id);
        if (!empleado) throw new AppError("Empleado no encontrado.", 404, "EMPLOYEE_NOT_FOUND");

        const cajasAtendidas = await Caja.count({ where: { empleadoId: id } });
        const pedidosProcesados = await Pedido.count();
        let totalFacturado = 0;
        try {
            totalFacturado = await Pedido.sum("total", { where: { cobrado: true } }) || 0;
        } catch (e) {
            totalFacturado = 0;
        }

        return {
            empleadoId: empleado.id,
            nombre: empleado.nombre,
            cajasAtendidas,
            pedidosProcesados,
            totalFacturado: parseFloat(totalFacturado)
        };
    }

    async obtenerReporteEmpleados(negocioId, query = {}) {
        if (!negocioId) throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        const { Empleado, Caja, Pedido } = await this._getModels(negocioId);

        const empleados = await Empleado.findAll();
        const items = [];

        for (const emp of empleados) {
            const cajas = await Caja.count({ where: { empleadoId: emp.id } });
            items.push({
                id: emp.id,
                nombre: emp.nombre,
                email: emp.email,
                rol: emp.rol,
                activo: emp.activo,
                cajasAtendidas: cajas,
                pedidosAtendidos: 0,
                totalRecaudado: 0
            });
        }

        return { items };
    }
}

export const desempenoEmpleadosService = new DesempenoEmpleadosService();
