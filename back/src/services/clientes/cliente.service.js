import { AppError } from "../../utils/errors.js";
import { models, sequelize } from "../../models/index.js";
import { getPaginationParams, getPagingData } from "../../utils/pagination.util.js";
import { Op } from "sequelize";

export const obtenerClientes = async (negocioId, queryParams = {}) => {
    const { limit, offset, page } = getPaginationParams(queryParams);
    const { search, sortBy, sortOrder } = queryParams;

    const where = { negocioId, activo: true };

    if (search) {
        where[Op.or] = [
            { nombre: { [Op.iLike]: `%${search}%` } },
            { telefono: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } }
        ];
    }

    let order = [["createdAt", "DESC"]];
    if (sortBy) {
        const direction = sortOrder && sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";
        order = [[sortBy, direction]];
    }

    const data = await models.Cliente.findAndCountAll({
        where,
        order,
        limit,
        offset
    });

    return getPagingData(data, page, limit);
};

export const obtenerClientePorId = async (negocioId, clienteId) => {
    const cliente = await models.Cliente.findOne({
        where: { id: clienteId, negocioId },
        include: [
            { 
                model: models.Pedido, 
                as: "pedidos",
                required: false, // LEFT JOIN
                attributes: ["id", "estado", "total", "codigoSeguimiento", "createdAt", "cobrado", "facturado"]
            },
            {
                model: models.MovimientoCuentaCorriente,
                as: "movimientosCuentaCorriente",
                required: false,
                attributes: ["id", "tipoMovimiento", "monto", "saldoResultante", "comentario", "createdAt"]
            }
        ],
        order: [
            [{ model: models.Pedido, as: "pedidos" }, "createdAt", "DESC"],
            [{ model: models.MovimientoCuentaCorriente, as: "movimientosCuentaCorriente" }, "createdAt", "DESC"]
        ]
    });

    if (!cliente) {
        throw new AppError("Cliente no encontrado.", 404);
    }
    return cliente;
};

export const crearCliente = async (negocioId, clienteData) => {
    const { nombre, telefono, email } = clienteData;

    const existeTelefono = await models.Cliente.findOne({ where: { telefono, negocioId } });
    if (existeTelefono) {
        throw new AppError("Ya existe un cliente con ese teléfono en este negocio.", 400);
    }

    const nuevoCliente = await models.Cliente.create({
        negocioId,
        nombre,
        telefono,
        email,
        activo: true
    });

    return nuevoCliente;
};

export const actualizarCliente = async (negocioId, clienteId, updateData) => {
    const { nombre, telefono, email } = updateData;

    const cliente = await models.Cliente.findOne({ where: { id: clienteId, negocioId } });
    if (!cliente) {
        throw new AppError("Cliente no encontrado.", 404);
    }

    if (telefono && telefono !== cliente.telefono) {
        const existeTelefono = await models.Cliente.findOne({ where: { telefono, negocioId } });
        if (existeTelefono) {
            throw new AppError("Ya existe otro cliente con ese teléfono en este negocio.", 400);
        }
    }

    await cliente.update({ nombre, telefono, email });
    return cliente;
};

export const desactivarCliente = async (negocioId, clienteId, motivoBaja) => {
    const cliente = await models.Cliente.findOne({ where: { id: clienteId, negocioId } });
    if (!cliente) {
        throw new AppError("Cliente no encontrado.", 404);
    }

    if (parseFloat(cliente.saldoCuentaCorriente) !== 0) {
        throw new AppError(`No se puede dar de baja al cliente porque tiene un saldo en cuenta corriente de $${cliente.saldoCuentaCorriente}.`, 400);
    }

    // Regla de Negocio: No se puede dar de baja a un cliente si tiene pedidos activos (No Entregados/Cancelados)
    const pedidosActivos = await models.Pedido.count({
        where: {
            clienteId,
            estado: {
                [Op.notIn]: ["ENTREGADO", "CANCELADO"]
            }
        }
    });

    if (pedidosActivos > 0) {
        throw new AppError(`No se puede dar de baja al cliente porque tiene ${pedidosActivos} pedido(s) en curso.`, 400);
    }

    await cliente.update({ activo: false, motivoBaja });
    return true;
};

export const registrarPagoCuentaCorriente = async (negocioId, clienteId, pagoData) => {
    const { monto, metodoPago, comentario } = pagoData;

    if (!monto || parseFloat(monto) <= 0) {
        throw new AppError("El monto del pago debe ser mayor a 0.", 400);
    }

    const t = await sequelize.transaction();

    try {
        // Lock row for update
        const cliente = await models.Cliente.findOne({ 
            where: { id: clienteId, negocioId },
            transaction: t,
            lock: t.LOCK.UPDATE 
        });

        if (!cliente) {
            throw new AppError("Cliente no encontrado.", 404);
        }

        const saldoAnterior = parseFloat(cliente.saldoCuentaCorriente);
        const nuevoSaldo = saldoAnterior - parseFloat(monto);

        const movimiento = await models.MovimientoCuentaCorriente.create({
            clienteId,
            negocioId,
            tipoMovimiento: "CREDITO",
            monto: parseFloat(monto),
            saldoResultante: nuevoSaldo,
            comentario: comentario || `Pago en ${metodoPago}`
        }, { transaction: t });

        await cliente.update({ saldoCuentaCorriente: nuevoSaldo }, { transaction: t });

        await t.commit();
        return { cliente, movimiento };
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

export const recalcularSaldoCuentaCorriente = async (negocioId, clienteId) => {
    const t = await sequelize.transaction();

    try {
        const cliente = await models.Cliente.findOne({ 
            where: { id: clienteId, negocioId },
            transaction: t,
            lock: t.LOCK.UPDATE 
        });

        if (!cliente) {
            throw new AppError("Cliente no encontrado.", 404);
        }

        const movimientos = await models.MovimientoCuentaCorriente.findAll({
            where: { clienteId, negocioId },
            order: [['createdAt', 'ASC']],
            transaction: t
        });

        let saldoReal = 0;
        for (const mov of movimientos) {
            if (mov.tipoMovimiento === 'DEBITO') {
                saldoReal += parseFloat(mov.monto);
            } else if (mov.tipoMovimiento === 'CREDITO') {
                saldoReal -= parseFloat(mov.monto);
            }
            
            // Correct the running balance on the movement if it was wrong
            if (parseFloat(mov.saldoResultante) !== saldoReal) {
                await mov.update({ saldoResultante: saldoReal }, { transaction: t });
            }
        }

        if (parseFloat(cliente.saldoCuentaCorriente) !== saldoReal) {
            await cliente.update({ saldoCuentaCorriente: saldoReal }, { transaction: t });
        }

        await t.commit();
        return { saldoCorregido: saldoReal };
    } catch (error) {
        await t.rollback();
        throw error;
    }
};
