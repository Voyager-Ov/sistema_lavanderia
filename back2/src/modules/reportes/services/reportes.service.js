import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class ReportesService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    // Reporte de Ventas por Método de Pago dinámico del negocio
    async obtenerReporteVentasPorMetodoPago(negocioId, query = {}) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Cobro, MetodoPago } = await this._getModels(negocioId);

        const cobros = await Cobro.findAll({
            include: [{ model: MetodoPago, as: "metodoPago" }]
        });

        // Agrupar cobros dinámicamente por el nombre del Método de Pago del negocio
        const agrupado = {};

        for (const c of cobros) {
            const nombreMetodo = c.metodoPago ? c.metodoPago.nombre : "Otros";
            const iconoMetodo = c.metodoPago ? c.metodoPago.icono : "CreditCard";
            const monto = parseFloat(c.montoAbonado) || 0;

            if (!agrupado[nombreMetodo]) {
                agrupado[nombreMetodo] = {
                    nombre: nombreMetodo,
                    icono: iconoMetodo,
                    totalMonto: 0,
                    cantidadCobros: 0
                };
            }

            agrupado[nombreMetodo].totalMonto += monto;
            agrupado[nombreMetodo].cantidadCobros += 1;
        }

        const resultado = Object.values(agrupado).sort((a, b) => b.totalMonto - a.totalMonto);

        return {
            totalRecaudado: resultado.reduce((acc, curr) => acc + curr.totalMonto, 0),
            items: resultado
        };
    }

    // Reporte General de Finanzas e Ingresos
    async obtenerReporteGeneralFinanzas(negocioId, query = {}) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Cobro, Pedido } = await this._getModels(negocioId);

        const totalCobros = await Cobro.sum("montoAbonado") || 0;
        const totalPedidos = await Pedido.count();
        const pedidosCobrados = await Pedido.count({ where: { cobrado: true } });

        return {
            totalIngresos: parseFloat(totalCobros),
            totalPedidos,
            pedidosCobrados,
            pedidosPendientesPago: totalPedidos - pedidosCobrados
        };
    }
}

export const reportesService = new ReportesService();
