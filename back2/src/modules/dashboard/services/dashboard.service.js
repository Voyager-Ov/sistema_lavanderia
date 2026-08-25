import { Op } from "sequelize";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

function getLocalDayRange(d = new Date()) {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    return { start, end };
}

function getLocalMonthRange(year, month) {
    const start = new Date(year, month, 1, 0, 0, 0, 0);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return { start, end };
}

class DashboardService {

    async _getModels(negocioId) {
        const tenantContext = await connectionManager.getTenantDb(negocioId);
        return tenantContext;
    }

    async obtenerEstadisticasDashboard(negocioId) {
        if (!negocioId) {
            throw new AppError("No se ha identificado el negocio activo en la sesión.", 400, "MISSING_TENANT_ID");
        }
        const { sequelize, models } = await this._getModels(negocioId);
        const { Pedido, Cliente, DetallePedido, Servicio, Cobro, MovimientoCaja } = models;

        const now = new Date();

        // 1. Rangos de Fecha Locales
        const hoyRange = getLocalDayRange(now);
        
        const ayerDate = new Date(now);
        ayerDate.setDate(ayerDate.getDate() - 1);
        const ayerRange = getLocalDayRange(ayerDate);

        const mesActualRange = getLocalMonthRange(now.getFullYear(), now.getMonth());

        const mesAnteriorDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const mesAnteriorRange = getLocalMonthRange(mesAnteriorDate.getFullYear(), mesAnteriorDate.getMonth());

        // 2. Ingresos acumulados (de Hoy, Ayer, Mes Actual, Mes Anterior)
        const calcularIngresosRango = async (range) => {
            let total = 0;
            // Suma desde MovimientoCaja (si aplica) o Cobro
            if (MovimientoCaja) {
                const totalMov = await MovimientoCaja.sum("monto", {
                    where: {
                        fechaHora: { [Op.between]: [range.start, range.end] },
                        tipoMovimiento: "Ingreso por Venta"
                    }
                });
                if (totalMov && !isNaN(parseFloat(totalMov))) {
                    total = Math.abs(parseFloat(totalMov));
                }
            }
            if (total === 0 && Cobro) {
                const totalCobro = await Cobro.sum("montoAbonado", {
                    where: {
                        fechaHora: { [Op.between]: [range.start, range.end] }
                    }
                });
                if (totalCobro && !isNaN(parseFloat(totalCobro))) {
                    total = parseFloat(totalCobro);
                }
            }
            return total;
        };

        const hoyCobrado = await calcularIngresosRango(hoyRange);
        const ayerCobrado = await calcularIngresosRango(ayerRange);
        const mesActual = await calcularIngresosRango(mesActualRange);
        const mesAnterior = await calcularIngresosRango(mesAnteriorRange);

        // 3. Cantidad de Pedidos (Hoy y Ayer)
        const hoyTotalPedidos = await Pedido.count({
            where: {
                fechaHoraCreacion: { [Op.between]: [hoyRange.start, hoyRange.end] }
            }
        });

        const ayerTotalPedidos = await Pedido.count({
            where: {
                fechaHoraCreacion: { [Op.between]: [ayerRange.start, ayerRange.end] }
            }
        });

        // 4. Conteo de Pedidos Activos por Estado
        const pedidosBase = await Pedido.findAll({
            attributes: ["numeroPedido", "estado", "fechaHoraCreacion"],
            where: {
                estado: { [Op.notLike]: "%CANCELAD%" }
            }
        });

        const pedidosActivos = {
            PENDIENTE: 0,
            EN_PROCESO: 0,
            LISTO_PARA_RETIRAR: 0,
            ENTREGADO: 0,
            PAGADO: 0,
            CANCELADO: 0
        };

        pedidosBase.forEach(p => {
            const est = String(p.estado).toUpperCase();
            if (est.includes("PENDIENTE")) pedidosActivos.PENDIENTE++;
            else if (est.includes("PROCESO") || est.includes("LAVADO")) pedidosActivos.EN_PROCESO++;
            else if (est.includes("LISTO")) pedidosActivos.LISTO_PARA_RETIRAR++;
            else if (est.includes("ENTREGADO")) pedidosActivos.ENTREGADO++;
            else if (est.includes("PAGADO")) pedidosActivos.PAGADO++;
            else if (est.includes("CANCELAD")) pedidosActivos.CANCELADO++;
        });

        // Conteo específico de cancelados
        pedidosActivos.CANCELADO = await Pedido.count({
            where: { estado: { [Op.like]: "%CANCELAD%" } }
        });

        // 5. Últimos 5 Pedidos Recientes
        const pedidosRecientes = await Pedido.findAll({
            limit: 5,
            order: [["numeroPedido", "DESC"]],
            include: [
                { model: Cliente, as: "cliente", attributes: ["id", "nombre", "apellido"] }
            ]
        });

        const ultimosPedidos = pedidosRecientes.map(p => {
            const estUpper = String(p.estado).toUpperCase();
            let badgeColor = "yellow";
            if (estUpper.includes("ENTREGADO")) badgeColor = "green";
            else if (estUpper.includes("EN_PROCESO") || estUpper.includes("LAVADO")) badgeColor = "blue";
            else if (estUpper.includes("CANCELAD")) badgeColor = "red";

            const clienteNombre = p.cliente
                ? (p.cliente.apellido ? `${p.cliente.nombre} ${p.cliente.apellido}` : p.cliente.nombre)
                : "Cliente Mostrador";

            return {
                id: p.numeroPedido,
                title: `Pedido #${p.numeroPedido} - ${clienteNombre}`,
                subtitle: `Creado el ${new Date(p.fechaHoraCreacion).toLocaleDateString("es-AR")}`,
                badgeText: p.estado,
                badgeColor
            };
        });

        // 6. Ventas por Día de la Semana (Últimos 7 Días)
        const diasSemana = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
        const ventasPorDiaList = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dRange = getLocalDayRange(d);
            const name = diasSemana[d.getDay()];

            const ventasDia = await calcularIngresosRango(dRange);
            ventasPorDiaList.push({ name, ventas: ventasDia });
        }

        // 7. Top Clientes Recurrentes
        const topClientesRaw = await Pedido.findAll({
            attributes: [
                "clienteId",
                [sequelize.fn("COUNT", sequelize.col("numeroPedido")), "pedidosCount"]
            ],
            where: {
                clienteId: { [Op.ne]: null }
            },
            group: ["clienteId", "cliente.id", "cliente.nombre", "cliente.apellido"],
            include: [
                { model: Cliente, as: "cliente", attributes: ["id", "nombre", "apellido"] }
            ],
            order: [[sequelize.fn("COUNT", sequelize.col("numeroPedido")), "DESC"]],
            limit: 5
        });

        const topClientes = topClientesRaw.map(tc => {
            const cl = tc.cliente;
            const nombreCompleto = cl
                ? (cl.apellido ? `${cl.nombre} ${cl.apellido}` : cl.nombre)
                : "Cliente";
            return {
                id: tc.clienteId,
                nombre: nombreCompleto,
                pedidos: parseInt(tc.get("pedidosCount"), 10) || 0
            };
        });

        return {
            ingresos: {
                mesActual,
                mesAnterior,
                hoyCobrado,
                ayerCobrado,
                hoyTotalPedidos
            },
            pedidosDelDia: {
                hoy: hoyTotalPedidos,
                ayer: ayerTotalPedidos
            },
            pedidosActivos,
            topProductos: [],
            topClientes,
            ultimosPedidos,
            ventasPorDia: ventasPorDiaList
        };
    }
}

export const dashboardService = new DashboardService();
