import { Op } from "sequelize";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class ClientesService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    // Listar clientes con paginación, búsqueda por nombre/teléfono/email y ordenamiento
    async listarClientes(negocioId, query = {}) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Cliente, CuentaCorriente } = await this._getModels(negocioId);

        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 50;
        const offset = (page - 1) * limit;

        const where = {};

        // Filtro por término de búsqueda (nombre, teléfono o email)
        if (query.search && query.search.trim() !== "") {
            const searchVal = query.search.trim();
            const searchOp = process.env.NODE_ENV === "test" ? Op.like : Op.iLike;
            where[Op.or] = [
                { nombre: { [searchOp]: `%${searchVal}%` } },
                { apellido: { [searchOp]: `%${searchVal}%` } },
                { telefono: { [searchOp]: `%${searchVal}%` } },
                { email: { [searchOp]: `%${searchVal}%` } }
            ];
        }

        const sortBy = query.sortBy || "id";
        const sortOrder = (query.sortOrder || "DESC").toUpperCase();

        const { count, rows } = await Cliente.findAndCountAll({
            where,
            include: [{ model: CuentaCorriente, as: "cuentaCorriente", attributes: ["saldo"], required: false }],
            limit,
            offset,
            order: [[sortBy, sortOrder]]
        });

        const totalPages = Math.ceil(count / limit) || 1;

        return {
            items: rows,
            meta: {
                totalItems: count,
                total: count,
                totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        };
    }

    // Obtener cliente por ID
    async obtenerClientePorId(negocioId, id) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Cliente, CuentaCorriente, Pedido } = await this._getModels(negocioId);

        const cliente = await Cliente.findOne({
            where: { id },
            include: [
                { model: CuentaCorriente, as: "cuentaCorriente" },
                { model: Pedido, as: "pedidos", limit: 10, order: [["numeroPedido", "DESC"]] }
            ]
        });

        if (!cliente) {
            throw new AppError("Cliente no encontrado", 404, "CLIENT_NOT_FOUND");
        }

        return cliente;
    }

    // Crear cliente nuevo
    async crearCliente(negocioId, data) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Cliente, CuentaCorriente } = await this._getModels(negocioId);

        if (!data.nombre || data.nombre.trim() === "") {
            throw new AppError("El nombre del cliente es obligatorio.", 400, "MISSING_CLIENT_NAME");
        }

        const nuevoCliente = await Cliente.create({
            nombre: data.nombre.trim(),
            apellido: data.apellido ? data.apellido.trim() : "",
            telefono: data.telefono ? data.telefono.trim() : null,
            email: data.email ? data.email.trim() : null,
            direccion: data.direccion ? data.direccion.trim() : null,
            negocioId
        });

        // Crear su cuenta corriente con saldo inicial 0
        await CuentaCorriente.create({
            clienteId: nuevoCliente.id,
            saldo: 0
        });

        return this.obtenerClientePorId(negocioId, nuevoCliente.id);
    }

    // Actualizar cliente
    async actualizarCliente(negocioId, id, data) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Cliente } = await this._getModels(negocioId);

        const cliente = await Cliente.findByPk(id);
        if (!cliente) {
            throw new AppError("Cliente no encontrado para actualizar.", 404, "CLIENT_NOT_FOUND");
        }

        const updateFields = {};
        if (data.nombre !== undefined) updateFields.nombre = data.nombre.trim();
        if (data.apellido !== undefined) updateFields.apellido = data.apellido.trim();
        if (data.telefono !== undefined) updateFields.telefono = data.telefono.trim();
        if (data.email !== undefined) updateFields.email = data.email.trim();
        if (data.direccion !== undefined) updateFields.direccion = data.direccion.trim();

        await cliente.update(updateFields);

        return this.obtenerClientePorId(negocioId, id);
    }

    // Desactivar / Eliminar cliente
    async eliminarCliente(negocioId, id) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Cliente } = await this._getModels(negocioId);

        const cliente = await Cliente.findByPk(id);
        if (!cliente) {
            throw new AppError("Cliente no encontrado para eliminar.", 404, "CLIENT_NOT_FOUND");
        }

        await cliente.destroy();
        return { message: "Cliente eliminado correctamente." };
    }
}

export const clientesService = new ClientesService();
