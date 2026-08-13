import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import { categoriasGastosService } from "./categoriasGastos.service.js";

class GastosService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    async registrarGasto(negocioId, data) {
        if (!negocioId) throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        const { Gasto, CategoriaGasto, Caja, MovimientoCaja, MetodoPago } = await this._getModels(negocioId);

        const monto = parseFloat(data.monto || data.montoTotal) || 0;
        if (monto <= 0) {
            throw new AppError("El monto del gasto debe ser mayor a cero.", 400, "INVALID_EXPENSE_AMOUNT");
        }

        // Determinar CategoriaGasto
        let categoriaGastoId = data.categoriaGastoId;
        if (!categoriaGastoId && data.categoria) {
            if (typeof data.categoria === "number") {
                categoriaGastoId = data.categoria;
            } else {
                const catObj = await categoriasGastosService.crearCategoria(negocioId, { nombre: data.categoria });
                categoriaGastoId = catObj.id;
            }
        }

        // Buscar caja abierta para asociar egreso
        const cajaAbierta = await Caja.findOne({ where: { estadoCaja: "Abierta" } });

        let movimientoCajaId = null;
        if (cajaAbierta) {
            const nuevoMovimiento = await MovimientoCaja.create({
                monto: -monto, // Registrar egreso en caja
                tipoMovimiento: "Egreso por Gasto",
                observacion: `Gasto: ${data.descripcion || "Egreso operativo"}`,
                cajaIdCaja: cajaAbierta.idCaja
            });
            movimientoCajaId = nuevoMovimiento.id;
        }

        const nuevoGasto = await Gasto.create({
            montoTotal: monto,
            descripcion: data.descripcion || "Gasto operativo",
            proveedor: data.proveedor || null,
            nroComprobante: data.nroComprobante || null,
            desgloseNeto: parseFloat(data.desgloseNeto) || monto,
            impuestos: parseFloat(data.impuestos) || 0,
            percepciones: parseFloat(data.percepciones) || 0,
            estadoGasto: "Pagado",
            fechaHora: new Date(),
            negocioId,
            categoriaGastoId,
            metodoPagoId: data.metodoPagoId || 1,
            movimientoCajaId
        });

        return nuevoGasto;
    }

    async obtenerGastos(negocioId, query = {}) {
        if (!negocioId) throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        const { Gasto, CategoriaGasto, MetodoPago } = await this._getModels(negocioId);

        const limit = parseInt(query.limit) || 50;
        const offset = parseInt(query.offset) || 0;

        const { count, rows } = await Gasto.findAndCountAll({
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
        if (!negocioId) throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        const { Gasto, CategoriaGasto, MetodoPago } = await this._getModels(negocioId);

        const gasto = await Gasto.findByPk(id, {
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
