import { BaseReportService } from "./baseReport.service.js";

export class ReporteFinanzasService extends BaseReportService {
    // Reporte de Ventas por Método de Pago dinámico del negocio
    async obtenerReporteVentasPorMetodoPago(negocioId, query = {}) {
        const { Cobro, MetodoPago } = await this._getModels(negocioId);

        const cobros = await Cobro.findAll({
            include: [{ model: MetodoPago, as: "metodoPago" }]
        });

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

export const reporteFinanzasService = new ReporteFinanzasService();
