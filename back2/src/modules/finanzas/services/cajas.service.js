import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import { cajasSocket } from "../sockets/cajas.socket.js";

class CajasService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    // Formatea una caja para cumplir con la interfaz completa de CajaActual del frontend
    _formatCaja(caja) {
        const plain = caja.get ? caja.get({ plain: true }) : caja;

        let totalIngresosEnVivo = 0;
        let totalEgresosEnVivo = 0;
        let totalIngresosEfectivo = 0;
        let totalIngresosDigitales = 0;
        let totalEgresosEfectivo = 0;
        let totalEgresosDigitales = 0;

        const pagos = [];
        const gastos = [];
        const metodoMap = {
            "Efectivo": { metodoPagoId: 1, nombre: "Efectivo", ingresos: 0, egresos: 0 }
        };

        if (plain.movimientos && Array.isArray(plain.movimientos)) {
            for (const mov of plain.movimientos) {
                const montoVal = parseFloat(mov.monto) || 0;
                const isIngreso = mov.tipoMovimiento?.toLowerCase().includes("ingreso") || mov.tipoMovimiento?.toLowerCase().includes("venta") || montoVal > 0;
                const absMonto = Math.abs(montoVal);

                const metodoNombre = "Efectivo";
                const isEfectivo = true;

                if (isIngreso) {
                    totalIngresosEnVivo += absMonto;
                    totalIngresosEfectivo += absMonto;
                    metodoMap["Efectivo"].ingresos += absMonto;

                    pagos.push({
                        id: mov.id,
                        monto: absMonto,
                        estado: "COMPLETADO",
                        createdAt: mov.fechaHora || mov.createdAt,
                        metodoPago: { id: 1, nombre: "Efectivo", esFijo: true },
                        pedido: {
                            id: mov.id,
                            codigoSeguimiento: mov.observacion || `MOV-${mov.id}`,
                            total: absMonto,
                            estado: "ENTREGADO",
                            fechaRecepcion: mov.fechaHora || mov.createdAt
                        }
                    });
                } else {
                    totalEgresosEnVivo += absMonto;
                    totalEgresosEfectivo += absMonto;
                    metodoMap["Efectivo"].egresos += absMonto;

                    gastos.push({
                        id: mov.id,
                        monto: absMonto,
                        categoria: "GASTO_GENERAL",
                        descripcion: mov.observacion || "Gasto de caja",
                        createdAt: mov.fechaHora || mov.createdAt,
                        metodoPago: { id: 1, nombre: "Efectivo", esFijo: true }
                    });
                }
            }
        }

        const montoInicial = parseFloat(plain.montoInicialEfectivo) || 0;
        const efectivoEsperadoEnVivo = montoInicial + totalIngresosEfectivo - totalEgresosEfectivo;
        const totalesPorMetodo = Object.values(metodoMap);

        return {
            id: plain.idCaja,
            idCaja: plain.idCaja,
            negocioId: plain.negocioId,
            usuarioId: plain.empleadoId || 1,
            estado: plain.estadoCaja === "Abierta" ? "ABIERTA" : "CERRADA",
            estadoCaja: plain.estadoCaja,
            montoInicial,
            fechaApertura: plain.fechaHoraApertura || plain.createdAt,
            fechaCierre: plain.fechaHoraCierre,
            totalIngresosEnVivo,
            totalEgresosEnVivo,
            totalIngresosEfectivo,
            totalIngresosDigitales,
            totalEgresosEfectivo,
            totalEgresosDigitales,
            efectivoEsperado: efectivoEsperadoEnVivo,
            efectivoEsperadoEnVivo,
            efectivoReal: plain.montoFinalEfectivoReal,
            totalesPorMetodo,
            actividadTurno: [],
            usuario: {
                id: plain.empleadoId || 1,
                nombre: "Cajero de Mostrador",
                email: "mostrador@lavanderia.com"
            },
            pagos,
            gastos
        };
    }

    // Obtener la caja activa actualmente (o la última caja)
    async obtenerCajaActual(negocioId) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Caja, MovimientoCaja } = await this._getModels(negocioId);

        let caja = await Caja.findOne({
            where: { estadoCaja: "Abierta" },
            include: [{ model: MovimientoCaja, as: "movimientos" }],
            order: [["idCaja", "DESC"]]
        });

        if (!caja) {
            caja = await Caja.findOne({
                include: [{ model: MovimientoCaja, as: "movimientos" }],
                order: [["idCaja", "DESC"]]
            });
        }

        if (!caja) {
            caja = await Caja.create({
                montoInicialEfectivo: 0,
                estadoCaja: "Abierta",
                observacionApertura: "Apertura inicial del sistema",
                negocioId
            });
        }

        return this._formatCaja(caja);
    }

    // Abrir un nuevo turno de caja
    async abrirCaja(negocioId, data) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Caja } = await this._getModels(negocioId);

        const cajaAbierta = await Caja.findOne({ where: { estadoCaja: "Abierta" } });
        if (cajaAbierta) {
            throw new AppError("Ya existe un turno de caja abierto actualmente.", 400, "CASH_REGISTER_ALREADY_OPEN");
        }

        const montoInicial = parseFloat(data.montoInicial || data.montoInicialEfectivo || 0);

        const nuevaCaja = await Caja.create({
            montoInicialEfectivo: montoInicial,
            estadoCaja: "Abierta",
            observacionApertura: data.observaciones || "Apertura de turno",
            fechaHoraApertura: new Date(),
            negocioId
        });

        const formattedApertura = this._formatCaja(nuevaCaja);
        cajasSocket.emitirCajaAbierta(negocioId, formattedApertura);
        return formattedApertura;
    }

    // Cerrar el turno de caja activo
    async cerrarCaja(negocioId, idCaja, data) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Caja, MovimientoCaja } = await this._getModels(negocioId);

        const caja = await Caja.findOne({
            where: { idCaja },
            include: [{ model: MovimientoCaja, as: "movimientos" }]
        });

        if (!caja) {
            throw new AppError("Caja no encontrada para cerrar.", 404, "CASH_REGISTER_NOT_FOUND");
        }

        if (caja.estadoCaja === "Cerrada") {
            return this._formatCaja(caja);
        }

        const efectivoReal = parseFloat(data.efectivoReal || data.montoFinalEfectivoReal || 0);

        await caja.update({
            estadoCaja: "Cerrada",
            montoFinalEfectivoReal: efectivoReal,
            fechaHoraCierre: new Date(),
            observacionCierre: data.observaciones || "Cierre de turno"
        });

        const formattedCierre = this._formatCaja(caja);
        cajasSocket.emitirCajaCerrada(negocioId, formattedCierre);
        return formattedCierre;
    }

    // Historial de cajas
    async obtenerHistorialCajas(negocioId, query = {}) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Caja, MovimientoCaja } = await this._getModels(negocioId);

        const limit = parseInt(query.limit) || 20;
        const offset = parseInt(query.offset) || 0;

        let count = 0;
        let rows = [];

        try {
            const res = await Caja.findAndCountAll({
                include: [{ model: MovimientoCaja, as: "movimientos" }],
                limit,
                offset,
                order: [["idCaja", "DESC"]]
            });
            count = res.count;
            rows = res.rows;
        } catch (err) {
            count = await Caja.count();
            rows = await Caja.findAll({
                include: [{ model: MovimientoCaja, as: "movimientos" }],
                limit,
                offset,
                order: [["idCaja", "DESC"]]
            });
        }

        const items = rows.map(c => this._formatCaja(c));

        return {
            total: count,
            items
        };
    }

    // Obtener caja por ID
    async obtenerCajaPorId(negocioId, idCaja) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Caja, MovimientoCaja } = await this._getModels(negocioId);

        const caja = await Caja.findOne({
            where: { idCaja },
            include: [{ model: MovimientoCaja, as: "movimientos" }]
        });

        if (!caja) {
            throw new AppError("Caja no encontrada.", 404, "CASH_REGISTER_NOT_FOUND");
        }

        return this._formatCaja(caja);
    }
}

export const cajasService = new CajasService();
