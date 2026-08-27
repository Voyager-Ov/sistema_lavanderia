import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import { parseDateRange } from "../../../utils/date.util.js";
import { categoriasGastosService } from "./categoriasGastos.service.js";
import { cajasSocket } from "../../finanzas/sockets/cajas.socket.js";

class GastosService {

    async _getModels(negocioId) {
        const tenantContext = await connectionManager.getTenantDb(negocioId);
        return { sequelize: tenantContext.sequelize, models: tenantContext.models };
    }

    async registrarGasto(negocioId, data) {
        if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        
        const { sequelize, models } = await this._getModels(negocioId);
        const { Gasto, CategoriaGasto, Caja, MovimientoCaja, MetodoPago } = models;

        const monto = parseFloat(data.monto);
        if (isNaN(monto) || monto <= 0) {
            throw new AppError("El monto del gasto debe ser un número positivo.", 400, "INVALID_EXPENSE_AMOUNT");
        }

        if (!data.metodoPagoId) {
            throw new AppError("El método de pago es obligatorio.", 400, "MISSING_PAYMENT_METHOD");
        }

        const metodoPagoObj = await MetodoPago.findByPk(data.metodoPagoId);
        if (!metodoPagoObj) {
            throw new AppError("El método de pago especificado no existe.", 400, "INVALID_PAYMENT_METHOD");
        }

        // Determinar CategoriaGasto por ID canónico o creación de nombre explícito
        let categoriaGastoId = null;
        if (data.categoriaGastoId) {
            categoriaGastoId = Number(data.categoriaGastoId);
        } else if (data.categoria && typeof data.categoria === "string" && data.categoria.trim() !== "") {
            const catObj = await categoriasGastosService.crearCategoria(negocioId, { nombre: data.categoria.trim() });
            categoriaGastoId = catObj.id;
        }

        const empleadoId = data.empleadoId;
        let cajaAbierta = null;
        if (empleadoId) {
            cajaAbierta = await Caja.findOne({ where: { estadoCaja: "Abierta", empleadoId } });
        }
        if (!cajaAbierta) {
            cajaAbierta = await Caja.findOne({ where: { estadoCaja: "Abierta" } });
        }
        if (!cajaAbierta) {
            throw new AppError("No posees una caja abierta actualmente. Debes abrir tu turno de caja antes de registrar un gasto.", 400, "NO_OPEN_CASH_REGISTER");
        }

        const desgloseNeto = data.desgloseNeto !== undefined ? parseFloat(data.desgloseNeto) : monto;
        const impuestos = data.impuestos !== undefined ? parseFloat(data.impuestos) : 0;
        const percepciones = data.percepciones !== undefined ? parseFloat(data.percepciones) : 0;
        
        const descripcion = data.descripcion && typeof data.descripcion === "string" && data.descripcion.trim() !== ""
            ? data.descripcion.trim()
            : null;
        const proveedor = data.proveedor && typeof data.proveedor === "string" && data.proveedor.trim() !== ""
            ? data.proveedor.trim()
            : null;
        const nroComprobante = data.nroComprobante && typeof data.nroComprobante === "string" && data.nroComprobante.trim() !== ""
            ? data.nroComprobante.trim()
            : null;

        const transaction = await sequelize.transaction();
        try {
            const obsMovimiento = descripcion ? `Gasto: ${descripcion}` : "Gasto sin descripción";
            const nuevoMovimiento = await MovimientoCaja.create({
                monto: -monto,
                tipoMovimiento: "Egreso por Gasto",
                observacion: obsMovimiento,
                metodoPagoId: data.metodoPagoId,
                cajaIdCaja: cajaAbierta.idCaja
            }, { transaction });

            const nuevoGasto = await Gasto.create({
                montoTotal: monto,
                descripcion,
                proveedor,
                nroComprobante,
                desgloseNeto,
                impuestos,
                percepciones,
                estadoGasto: "Pagado",
                fechaHora: new Date(),
                negocioId,
                categoriaGastoId,
                metodoPagoId: data.metodoPagoId,
                movimientoCajaId: nuevoMovimiento.id
            }, { transaction });

            await transaction.commit();

            cajasSocket.emitirGastoRegistrado(negocioId, nuevoGasto);
            return nuevoGasto;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async obtenerGastos(negocioId, query = {}) {
        if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        const { models } = await this._getModels(negocioId);
        const { Gasto, CategoriaGasto, MetodoPago } = models;

        const limit = query.limit !== undefined ? Math.max(1, parseInt(query.limit, 10)) : 50;
        const offset = query.offset !== undefined ? Math.max(0, parseInt(query.offset, 10)) : 0;

        const whereClause = { negocioId };

        const { fechaDesde, fechaHasta, categoriaGastoId, estadoGasto } = query;
        if (fechaDesde || fechaHasta) {
            const dateFilter = parseDateRange(fechaDesde, fechaHasta);
            if (dateFilter) {
                whereClause.fechaHora = dateFilter;
            }
        }

        if (categoriaGastoId) {
            whereClause.categoriaGastoId = Number(categoriaGastoId);
        }
        if (estadoGasto) {
            whereClause.estadoGasto = estadoGasto;
        }

        const { count, rows } = await Gasto.findAndCountAll({
            where: whereClause,
            include: [
                { model: CategoriaGasto, as: "categoria" },
                { model: MetodoPago, as: "metodoPago" }
            ],
            order: [["fechaHora", "DESC"]],
            limit,
            offset
        });

        return { total: count, items: rows };
    }

    async obtenerGastoPorId(negocioId, id) {
        if (!negocioId) throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        const { models } = await this._getModels(negocioId);
        const { Gasto, CategoriaGasto, MetodoPago } = models;

        const gasto = await Gasto.findOne({
            where: { id, negocioId },
            include: [
                { model: CategoriaGasto, as: "categoria" },
                { model: MetodoPago, as: "metodoPago" }
            ]
        });

        if (!gasto) throw new AppError("Gasto no encontrado.", 404, "EXPENSE_NOT_FOUND");
        return gasto;
    }
}

export const gastosService = new GastosService();
