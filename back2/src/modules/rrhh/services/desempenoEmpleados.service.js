import { Op } from "sequelize";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class DesempenoEmpleadosService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    async obtenerMetricasEmpleado(negocioId, id) {
        if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        const { Empleado, Caja, MovimientoCaja } = await this._getModels(negocioId);

        const idNum = parseInt(id);
        if (isNaN(idNum) || idNum <= 0) throw new AppError("ID de empleado inválido.", 400, "INVALID_ID");

        const empleado = await Empleado.findByPk(idNum);
        if (!empleado) throw new AppError("Empleado no encontrado.", 404, "EMPLOYEE_NOT_FOUND");

        // Buscar todas las cajas operadas por este empleado con sus movimientos
        const cajas = await Caja.findAll({
            where: { empleadoId: idNum },
            include: [{
                model: MovimientoCaja,
                as: "movimientos"
            }],
            order: [["idCaja", "DESC"]]
        });

        let totalCobrosMonto = 0;
        let totalCobrosCount = 0;
        let totalGastosMonto = 0;
        let totalGastosCount = 0;

        // Formatear la lista de cajas operadas por el empleado y calcular métricas acumuladas
        const cajasOperadas = cajas.map(c => {
            const plain = c.get ? c.get({ plain: true }) : c;
            const isAbierta = plain.estadoCaja === "Abierta";
            const montoInicial = parseFloat(plain.montoInicialEfectivo || 0);
            
            let ingEnVivo = 0;
            let egrEnVivo = 0;
            if (plain.movimientos && Array.isArray(plain.movimientos)) {
                for (const mov of plain.movimientos) {
                    const val = Math.abs(parseFloat(mov.monto) || 0);
                    const isIngreso = mov.tipoMovimiento === "Ingreso" || mov.tipoMovimiento === "CobroPedido";
                    if (isIngreso) {
                        ingEnVivo += val;
                        totalCobrosMonto += val;
                        totalCobrosCount++;
                    } else {
                        egrEnVivo += val;
                        totalGastosMonto += val;
                        totalGastosCount++;
                    }
                }
            }

            const efectivoEsperado = montoInicial + ingEnVivo - egrEnVivo;
            const efectivoReal = plain.montoFinalEfectivoReal !== null && plain.montoFinalEfectivoReal !== undefined 
                ? parseFloat(plain.montoFinalEfectivoReal) 
                : null;
            const diferenciaEfectivo = efectivoReal !== null ? (efectivoReal - efectivoEsperado) : 0;

            return {
                id: plain.idCaja,
                idCaja: plain.idCaja,
                fechaApertura: plain.fechaHoraApertura,
                fechaCierre: plain.fechaHoraCierre || null,
                montoInicial,
                diferenciaEfectivo,
                estado: isAbierta ? "ABIERTA" : "CERRADA",
                abierta: isAbierta,
                totalIngresos: ingEnVivo,
                totalEgresos: egrEnVivo
            };
        });

        return {
            empleadoId: empleado.id,
            nombre: empleado.nombre,
            cajasAtendidas: cajas.length,
            pedidosProcesados: totalCobrosCount,
            totalFacturado: totalCobrosMonto,
            ventasTotales: {
                monto: totalCobrosMonto,
                cantidad: totalCobrosCount
            },
            gastosRegistrados: {
                monto: totalGastosMonto,
                cantidad: totalGastosCount
            },
            cajasOperadas
        };
    }

    async obtenerReporteEmpleados(negocioId, query = {}) {
        if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        const { Empleado, Caja, MovimientoCaja } = await this._getModels(negocioId);

        const empleados = await Empleado.findAll();
        const items = [];

        for (const emp of empleados) {
            const cajas = await Caja.findAll({
                where: { empleadoId: emp.id },
                include: [{
                    model: MovimientoCaja,
                    as: "movimientos"
                }]
            });

            let totalRecaudado = 0;
            let pedidosAtendidos = 0;

            for (const caja of cajas) {
                if (caja.movimientos && Array.isArray(caja.movimientos)) {
                    for (const mov of caja.movimientos) {
                        const isIngreso = mov.tipoMovimiento === "Ingreso" || mov.tipoMovimiento === "CobroPedido";
                        if (isIngreso) {
                            totalRecaudado += Math.abs(parseFloat(mov.monto) || 0);
                            pedidosAtendidos++;
                        }
                    }
                }
            }

            items.push({
                id: emp.id,
                nombre: emp.nombre,
                email: emp.email,
                rol: emp.rol,
                activo: emp.activo,
                cajasAtendidas: cajas.length,
                pedidosAtendidos,
                totalRecaudado
            });
        }

        return { items };
    }
}

export const desempenoEmpleadosService = new DesempenoEmpleadosService();
