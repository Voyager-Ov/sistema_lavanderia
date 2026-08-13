import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class CajasService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    // Formatea una caja para cumplir con la interfaz del frontend
    _formatCaja(caja) {
        const plain = caja.get ? caja.get({ plain: true }) : caja;

        let totalIngresosEnVivo = 0;
        let totalEgresosEnVivo = 0;
        const pagos = [];
        const gastos = [];

        if (plain.movimientos && Array.isArray(plain.movimientos)) {
            for (const mov of plain.movimientos) {
                const montoVal = parseFloat(mov.monto) || 0;
                if (mov.tipoMovimiento === "Ingreso por Venta" || montoVal > 0) {
                    totalIngresosEnVivo += Math.abs(montoVal);
                    pagos.push({
                        id: mov.id,
                        monto: Math.abs(montoVal),
                        estado: "COMPLETADO",
                        createdAt: mov.fechaHora,
                        metodoPago: { id: 1, nombre: "Efectivo", esFijo: true }
                    });
                } else if (mov.tipoMovimiento === "Egreso por Gasto" || montoVal < 0) {
                    totalEgresosEnVivo += Math.abs(montoVal);
                    gastos.push({
                        id: mov.id,
                        monto: Math.abs(montoVal),
                        categoria: "GASTO_GENERAL",
                        descripcion: mov.observacion || "Gasto de caja",
                        createdAt: mov.fechaHora
                    });
                }
            }
        }

        const montoInicial = parseFloat(plain.montoInicialEfectivo) || 0;
        const efectivoEsperadoEnVivo = montoInicial + totalIngresosEnVivo - totalEgresosEnVivo;

        return {
            id: plain.idCaja,
            idCaja: plain.idCaja,
            negocioId: plain.negocioId,
            estado: plain.estadoCaja === "Abierta" ? "ABIERTA" : "CERRADA",
            estadoCaja: plain.estadoCaja,
            montoInicial,
            fechaApertura: plain.fechaHoraApertura,
            fechaCierre: plain.fechaHoraCierre,
            totalIngresosEnVivo,
            totalEgresosEnVivo,
            efectivoEsperadoEnVivo,
            efectivoReal: plain.montoFinalEfectivoReal,
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
            // Buscar la última caja cerrada si no hay abierta
            caja = await Caja.findOne({
                include: [{ model: MovimientoCaja, as: "movimientos" }],
                order: [["idCaja", "DESC"]]
            });
        }

        if (!caja) {
            // Auto-crear la primera caja en estado Abierta con $0 inicial
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

        // Verificar si ya hay una caja abierta
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

        return this._formatCaja(nuevaCaja);
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

        return this._formatCaja(caja);
    }

    // Historial de cajas
    async obtenerHistorialCajas(negocioId, query = {}) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Caja, MovimientoCaja } = await this._getModels(negocioId);

        const limit = parseInt(query.limit) || 20;
        const offset = parseInt(query.offset) || 0;

        const { count, rows } = await Caja.findAndCountAll({
            include: [{ model: MovimientoCaja, as: "movimientos" }],
            limit,
            offset,
            order: [["idCaja", "DESC"]],
            distinct: true
        });

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
