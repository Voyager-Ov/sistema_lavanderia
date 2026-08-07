import * as clienteCuentaService from "../../services/clientes/cliente-cuenta.service.js";
import * as creditoService from "../../services/clientes/credito.service.js";
import * as pagoCoreService from "../../services/pagos/pago-core.service.js";
import { successResponse } from "../../utils/response.util.js";
import { sequelize } from "../../models/index.js";

export const getEstadoCuenta = async (req, res, next) => {
    try {
        const estadoCuenta = await clienteCuentaService.obtenerEstadoCuenta(
            req.user.negocioId,
            req.params.id
        );
        return successResponse(res, 200, null, estadoCuenta);
    } catch (error) {
        next(error);
    }
};

export const getMovimientosCuenta = async (req, res, next) => {
    try {
        const movimientos = await clienteCuentaService.obtenerMovimientosCuenta(
            req.user.negocioId,
            req.params.id,
            req.query
        );
        return successResponse(res, 200, null, movimientos);
    } catch (error) {
        next(error);
    }
};

export const getCreditosDisponibles = async (req, res, next) => {
    try {
        const creditos = await clienteCuentaService.obtenerCreditosDisponibles(
            req.user.negocioId,
            req.params.id
        );
        return successResponse(res, 200, null, creditos);
    } catch (error) {
        next(error);
    }
};

export const cobrarDeuda = async (req, res, next) => {
    try {
        const resultado = await pagoCoreService.cobrarDeudaMasiva(
            req.user.negocioId,
            req.user.id,
            {
                clienteId: parseInt(req.params.id, 10),
                ...req.body
            }
        );
        return successResponse(res, 200, "Deuda cobrada y pedidos saldados exitosamente.", resultado);
    } catch (error) {
        next(error);
    }
};

export const crearAjusteManualCredito = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
        const credito = await creditoService.generarCreditoAjusteManual(
            req.user.negocioId,
            req.params.id,
            req.body.monto,
            req.body.motivo,
            req.user.id,
            t
        );
        await t.commit();
        return successResponse(res, 201, "Ajuste de saldo a favor generado exitosamente.", credito);
    } catch (error) {
        await t.rollback();
        next(error);
    }
};
