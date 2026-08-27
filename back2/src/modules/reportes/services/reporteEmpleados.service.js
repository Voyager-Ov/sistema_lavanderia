import { Op } from "sequelize";
import { BaseReportService } from "./baseReport.service.js";
import { AppError } from "../../../utils/appError.js";

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
        const pedidosCanceladosCount = pedidos.filter(p => {
            if (!p.estado) {
                throw new AppError(`El pedido N° ${p.numeroPedido} carece de un estado asignado en la base de datos.`, 400, "MISSING_ORDER_STATUS");
            }
            return p.estado.toString().toUpperCase().includes("CANCELAD");
        }).length;
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
            if (!c.metodoPago) {
                throw new AppError(`El cobro ID ${c.id} no posee método de pago asignado en la base de datos.`, 400, "MISSING_PAYMENT_METHOD");
            }
            if (c.montoAbonado === undefined || c.montoAbonado === null || isNaN(Number(c.montoAbonado))) {
                throw new AppError(`El monto abonado en el cobro ID ${c.id} es inválido.`, 400, "INVALID_AMOUNT");
            }

            const monto = Number(c.montoAbonado);
            const metodoNombre = c.metodoPago.nombre;
            const isEfectivo = metodoNombre.trim().toUpperCase() === "EFECTIVO";

            if (isEfectivo) {
                const efectivoRecibido = Number(c.montoRecibidoEfectivo);
                ingresosEfectivo += !isNaN(efectivoRecibido) && efectivoRecibido > 0 ? efectivoRecibido : monto;
            }

            if (!Object.prototype.hasOwnProperty.call(metodoMap, metodoNombre)) {
                metodoMap[metodoNombre] = 0;
            }
            metodoMap[metodoNombre] += monto;

            if (!c.fechaHora) {
                throw new AppError(`El cobro ID ${c.id} carece de fechaHora en la base de datos.`, 400, "MISSING_PAYMENT_DATE");
            }
            const dateStr = new Date(c.fechaHora).toISOString().split("T")[0];
            if (!Object.prototype.hasOwnProperty.call(trendMap, dateStr)) {
                trendMap[dateStr] = 0;
            }
            trendMap[dateStr] += monto;
        }

        const colors = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444"];
        const donut = Object.keys(metodoMap).map((mNombre, idx) => ({
            name: mNombre,
            value: metodoMap[mNombre],
            color: colors[idx % colors.length]
        }));

        const trend = Object.keys(trendMap).map(d => ({
            name: d,
            ingresos: trendMap[d]
        }));

        // 4. Tabla de Empleados
        const empleados = await Empleado.findAll({ where: { negocioId } });

        const tablaEmpleados = [];
        for (const emp of empleados) {
            if (!emp.nombre) {
                throw new AppError(`El empleado ID ${emp.id} carece de nombre en la base de datos.`, 400, "MISSING_EMPLOYEE_NAME");
            }
            if (!emp.rol) {
                throw new AppError(`El empleado ID ${emp.id} carece de rol asignado en la base de datos.`, 400, "MISSING_EMPLOYEE_ROLE");
            }

            const empNombre = emp.apellido ? `${emp.nombre} ${emp.apellido}` : emp.nombre;
            const empCajas = cajas.filter(cj => cj.empleadoId === emp.id);
            const empCajasCount = empCajas.length;
            const empCajaIds = empCajas.map(cj => cj.idCaja);
            
            let totalCobradoEmp = 0;
            let empPedidosCobrados = 0;
            cobros.forEach(c => {
                const cjId = c.movimientoCaja?.cajaIdCaja;
                if (cjId && empCajaIds.includes(cjId)) {
                    totalCobradoEmp += Number(c.montoAbonado);
                    empPedidosCobrados++;
                }
            });

            // Calculate actual canceled orders operated by employee during active cajas
            let empPedidosCancelados = 0;
            pedidos.forEach(p => {
                if (p.estado && p.estado.toString().toUpperCase().includes("CANCELAD")) {
                    const dateOrder = new Date(p.fechaHoraPedido || p.createdAt);
                    const matchCaja = empCajas.some(cj => {
                        const fApertura = new Date(cj.fechaHoraApertura);
                        const fCierre = cj.fechaHoraCierre ? new Date(cj.fechaHoraCierre) : new Date();
                        return dateOrder >= fApertura && dateOrder <= fCierre;
                    });
                    if (matchCaja) {
                        empPedidosCancelados++;
                    }
                }
            });

            tablaEmpleados.push({
                id: emp.id.toString(),
                nombre: empNombre,
                rol: emp.rol.toUpperCase(),
                cajasAbiertas: empCajasCount,
                pedidosGenerados: empPedidosCobrados,
                pedidosCancelados: empPedidosCancelados,
                totalCobrado: totalCobradoEmp
            });
        }

        // 5. Últimas Cajas
        const ultimasCajas = cajas.slice(0, 10).map(cj => {
            if (!cj.empleado) {
                throw new AppError(`La caja ID ${cj.idCaja} no posee un empleado responsable asignado en la base de datos.`, 400, "MISSING_EMPLOYEE_IN_CAJA");
            }
            if (!cj.empleado.nombre) {
                throw new AppError(`El empleado responsable de la caja ID ${cj.idCaja} carece de nombre registrado.`, 400, "MISSING_EMPLOYEE_NAME");
            }

            let totalIngresosEfectivo = 0;
            let totalEgresosEfectivo = 0;

            if (cj.movimientos && Array.isArray(cj.movimientos)) {
                cj.movimientos.forEach(m => {
                    if (m.monto === undefined || m.monto === null || isNaN(Number(m.monto))) {
                        throw new AppError(`El movimiento de caja ID ${m.id} posee un monto inválido.`, 400, "INVALID_MOVEMENT_AMOUNT");
                    }
                    if (!m.metodoPago) {
                        throw new AppError(`El movimiento de caja ID ${m.id} no posee método de pago.`, 400, "MISSING_PAYMENT_METHOD");
                    }

                    const montoVal = Number(m.monto);
                    const metodoNombre = m.metodoPago.nombre;
                    const isEfectivo = metodoNombre.trim().toUpperCase() === "EFECTIVO";
                    if (isEfectivo) {
                        if (montoVal > 0) totalIngresosEfectivo += montoVal;
                        else totalEgresosEfectivo += Math.abs(montoVal);
                    }
                });
            }

            if (cj.montoInicialEfectivo === undefined || cj.montoInicialEfectivo === null || isNaN(Number(cj.montoInicialEfectivo))) {
                throw new AppError(`La caja ID ${cj.idCaja} posee un monto inicial en efectivo inválido.`, 400, "INVALID_INITIAL_CASH");
            }

            const montoInicial = Number(cj.montoInicialEfectivo);
            const efectivoEsperado = montoInicial + totalIngresosEfectivo - totalEgresosEfectivo;
            const montoFinalReal = cj.montoFinalEfectivoReal !== null && cj.montoFinalEfectivoReal !== undefined ? Number(cj.montoFinalEfectivoReal) : efectivoEsperado;
            const diferencia = cj.estadoCaja === "Cerrada" ? (montoFinalReal - efectivoEsperado) : 0;

            const usuarioNombre = cj.empleado.apellido ? `${cj.empleado.nombre} ${cj.empleado.apellido}` : cj.empleado.nombre;

            return {
                id: cj.idCaja.toString(),
                fechaApertura: cj.fechaHoraApertura.toISOString(),
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
