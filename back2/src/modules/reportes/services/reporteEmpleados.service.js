import { Op } from "sequelize";
import { BaseReportService } from "./baseReport.service.js";

export class ReporteEmpleadosService extends BaseReportService {
    async obtenerReporteEmpleados(negocioId, query = {}) {
        const { Empleado, Caja, Pedido, Cobro, MetodoPago, MovimientoCaja } = await this._getModels(negocioId);

        // Date clause
        const dateClause = this._parseDateRange(query);

        const whereCaja = {};
        const wherePedido = {};
        const whereCobro = {};

        if (dateClause) {
            whereCaja.fechaHoraApertura = dateClause;
            wherePedido[Op.or] = [
                { fechaHoraCreacion: dateClause },
                { fechaHoraPedido: dateClause },
                { createdAt: dateClause }
            ];
            whereCobro.fechaHora = dateClause;
        }

        // 1. Fetch Cajas
        const cajas = await Caja.findAll({
            where: whereCaja,
            include: [
                { model: Empleado, as: "empleado" },
                { model: MovimientoCaja, as: "movimientos", include: [{ model: MetodoPago, as: "metodoPago" }] }
            ],
            order: [["idCaja", "DESC"]]
        });

        // 2. Fetch Pedidos
        const pedidos = await Pedido.findAll({ where: wherePedido });
        const totalPedidosCount = pedidos.length;
        const pedidosCanceladosCount = pedidos.filter(p => (p.estado || "").toString().toUpperCase().includes("CANCELAD")).length;
        const tasaCancelacionVal = totalPedidosCount > 0 ? ((pedidosCanceladosCount / totalPedidosCount) * 100).toFixed(1) : "0";

        // 3. Fetch Cobros for Revenue and Donut/Trend
        const cobros = await Cobro.findAll({
            where: whereCobro,
            include: [
                { model: MetodoPago, as: "metodoPago" },
                { model: MovimientoCaja, as: "movimientoCaja", include: [{ model: Caja, as: "caja" }] }
            ],
            order: [["fechaHora", "ASC"]]
        });

        let ingresosEfectivo = 0;
        const metodoMap = {};
        const trendMap = {};

        for (const c of cobros) {
            const monto = parseFloat(c.montoAbonado) || 0;
            const metodoNombre = c.metodoPago ? c.metodoPago.nombre : "Efectivo";
            const isEfectivo = metodoNombre.toLowerCase().includes("efectivo") || parseFloat(c.montoRecibidoEfectivo) > 0;

            if (isEfectivo) {
                ingresosEfectivo += parseFloat(c.montoRecibidoEfectivo) || monto;
            }

            metodoMap[metodoNombre] = (metodoMap[metodoNombre] || 0) + monto;

            const dateStr = c.fechaHora ? new Date(c.fechaHora).toISOString().split("T")[0] : "Hoy";
            trendMap[dateStr] = (trendMap[dateStr] || 0) + monto;
        }

        const colors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444"];
        const donut = Object.keys(metodoMap).map((mNombre, idx) => ({
            name: mNombre,
            value: metodoMap[mNombre],
            color: colors[idx % colors.length]
        }));

        if (donut.length === 0) {
            donut.push({ name: "Efectivo", value: ingresosEfectivo || 0, color: "#10b981" });
        }

        const trend = Object.keys(trendMap).map(d => ({
            name: d,
            ingresos: trendMap[d]
        }));

        // 4. Tabla de Empleados
        const empleados = await Empleado.findAll({ where: { negocioId } });

        const tablaEmpleados = [];
        for (const emp of empleados) {
            const empNombre = `${emp.nombre || ''} ${emp.apellido || ''}`.trim() || `Empleado #${emp.id}`;
            const empCajas = cajas.filter(cj => cj.empleadoId === emp.id);
            const empCajasCount = empCajas.length;
            const empCajaIds = empCajas.map(cj => cj.idCaja);
            
            let totalCobradoEmp = 0;
            let empPedidosCobrados = 0;
            cobros.forEach(c => {
                const cjId = c.movimientoCaja?.cajaIdCaja;
                if (cjId && empCajaIds.includes(cjId)) {
                    totalCobradoEmp += parseFloat(c.montoAbonado) || 0;
                    empPedidosCobrados++;
                }
            });

            tablaEmpleados.push({
                id: emp.id.toString(),
                nombre: empNombre,
                rol: (emp.rol || "EMPLEADO").toUpperCase(),
                cajasAbiertas: empCajasCount,
                pedidosGenerados: empPedidosCobrados,
                pedidosCancelados: 0,
                totalCobrado: totalCobradoEmp
            });
        }

        // 5. Últimas Cajas
        const ultimasCajas = cajas.slice(0, 10).map(cj => {
            let totalIngresosEfectivo = 0;
            let totalEgresosEfectivo = 0;
            if (cj.movimientos && Array.isArray(cj.movimientos)) {
                cj.movimientos.forEach(m => {
                    const montoVal = parseFloat(m.monto) || 0;
                    const metodoNombre = m.metodoPago?.nombre || "Efectivo";
                    const isEfectivo = !metodoNombre.toLowerCase().includes("transferencia") && !metodoNombre.toLowerCase().includes("mercadopago") && !metodoNombre.toLowerCase().includes("tarjeta");
                    if (isEfectivo) {
                        if (montoVal > 0) totalIngresosEfectivo += montoVal;
                        else totalEgresosEfectivo += Math.abs(montoVal);
                    }
                });
            }
            const montoInicial = parseFloat(cj.montoInicialEfectivo) || 0;
            const efectivoEsperado = montoInicial + totalIngresosEfectivo - totalEgresosEfectivo;
            const montoFinalReal = cj.montoFinalEfectivoReal !== null && cj.montoFinalEfectivoReal !== undefined ? parseFloat(cj.montoFinalEfectivoReal) : efectivoEsperado;
            const diferencia = cj.estadoCaja === "Cerrada" ? (montoFinalReal - efectivoEsperado) : 0;

            const usuarioNombre = cj.empleado 
                ? `${cj.empleado.nombre || ''} ${cj.empleado.apellido || ''}`.trim() 
                : defaultEmpleadoNombre;

            return {
                id: cj.idCaja.toString(),
                fechaApertura: cj.fechaHoraApertura ? cj.fechaHoraApertura.toISOString() : new Date().toISOString(),
                fechaCierre: cj.fechaHoraCierre ? cj.fechaHoraCierre.toISOString() : null,
                estado: cj.estadoCaja === "Abierta" ? "ABIERTA" : "CERRADA",
                usuario: usuarioNombre,
                montoInicial,
                montoFinal: montoFinalReal,
                diferencia
            };
        });

        return {
            kpis: {
                totalCajas: cajas.length,
                tasaCancelacion: tasaCancelacionVal,
                ingresosEfectivo
            },
            trend,
            donut,
            tablaEmpleados,
            ultimasCajas
        };
    }
}

export const reporteEmpleadosService = new ReporteEmpleadosService();
