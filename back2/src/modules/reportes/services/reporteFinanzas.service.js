import { BaseReportService } from "./baseReport.service.js";
import { AppError } from "../../../utils/appError.js";

export class ReporteFinanzasService extends BaseReportService {
    // Reporte de Ventas por Método de Pago dinámico del negocio
    async obtenerReporteVentasPorMetodoPago(negocioId, query = {}) {
        const { Cobro, MetodoPago } = await this._getModels(negocioId);

        const whereCobro = {};
        const dateClause = this._parseDateRange(query);
        if (dateClause) {
            whereCobro.fechaHora = dateClause;
        }

        const cobros = await Cobro.findAll({
            where: whereCobro,
            include: [{ model: MetodoPago, as: "metodoPago" }]
        });

        const agrupado = {};

        for (const c of cobros) {
            if (!c.metodoPago) {
                throw new AppError(`El cobro ID ${c.id} no posee un método de pago asociado en la base de datos.`, 400, "MISSING_PAYMENT_METHOD");
            }
            if (c.montoAbonado === undefined || c.montoAbonado === null || isNaN(Number(c.montoAbonado))) {
                throw new AppError(`El monto abonado en el cobro ID ${c.id} es inválido.`, 400, "INVALID_AMOUNT");
            }

            const nombreMetodo = c.metodoPago.nombre;
            const iconoMetodo = c.metodoPago.icono;
            const monto = Number(c.montoAbonado);

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

        const whereCobro = {};
        const wherePedido = {};
        const dateClause = this._parseDateRange(query);
        if (dateClause) {
            whereCobro.fechaHora = dateClause;
            wherePedido.createdAt = dateClause;
        }

        const rawSum = await Cobro.sum("montoAbonado", { where: whereCobro });
        const totalCobros = rawSum !== null && !isNaN(Number(rawSum)) ? Number(rawSum) : 0;
        const totalPedidos = await Pedido.count({ where: wherePedido });
        const pedidosCobrados = await Pedido.count({ where: { ...wherePedido, cobrado: true } });

        return {
            totalIngresos: totalCobros,
            totalPedidos,
            pedidosCobrados,
            pedidosPendientesPago: totalPedidos - pedidosCobrados
        };
    }
}

export const reporteFinanzasService = new ReporteFinanzasService();
