import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class CategoriasService {

    async _getModels(negocioId) {
        const tenantContext = await connectionManager.getTenantDb(negocioId);
        return { sequelize: tenantContext.sequelize, models: tenantContext.models };
    }

    async listarCategorias(negocioId) {
        if (!negocioId) {
            throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        }
        const { models } = await this._getModels(negocioId);
        const { CategoriaServicio, Servicio } = models;

        const categorias = await CategoriaServicio.findAll({
            where: { negocioId, activo: true },
            order: [["nombre", "ASC"]],
            include: [{
                model: Servicio,
                as: "servicios",
                where: { negocioId, activo: true },
                required: false,
                attributes: ["id"]
            }]
        });

        return { items: categorias };
    }

    async crearCategoria(negocioId, data) {
        if (!negocioId) {
            throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        }
        const { sequelize, models } = await this._getModels(negocioId);
        const { CategoriaServicio } = models;

        if (!data.nombre || typeof data.nombre !== "string" || data.nombre.trim() === "") {
            throw new AppError("El nombre de la categoría es obligatorio.", 400, "MISSING_CATEGORY_NAME");
        }

        const transaction = await sequelize.transaction();
        try {
            const nuevaCategoria = await CategoriaServicio.create({
                nombre: data.nombre.trim(),
                descripcion: (data.descripcion && typeof data.descripcion === "string" && data.descripcion.trim() !== "") ? data.descripcion.trim() : null,
                icono: (data.icono && typeof data.icono === "string" && data.icono.trim() !== "") ? data.icono.trim() : null,
                color: (data.color && typeof data.color === "string" && data.color.trim() !== "") ? data.color.trim() : null,
                activo: true,
                negocioId
            }, { transaction });

            await transaction.commit();
            return nuevaCategoria;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async actualizarCategoria(negocioId, id, data) {
        if (!negocioId) {
            throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        }
        if (!id) {
            throw new AppError("ID de categoría es requerido.", 400, "MISSING_CATEGORY_ID");
        }
        const { sequelize, models } = await this._getModels(negocioId);
        const { CategoriaServicio } = models;

        const categoria = await CategoriaServicio.findOne({ where: { id, negocioId, activo: true } });
        if (!categoria) {
            throw new AppError("Categoría no encontrada.", 404, "CATEGORY_NOT_FOUND");
        }

        const updateFields = {};
        if (data.nombre !== undefined) {
            if (typeof data.nombre !== "string" || data.nombre.trim() === "") {
                throw new AppError("El nombre de la categoría no puede estar vacío.", 400, "INVALID_CATEGORY_NAME");
            }
            updateFields.nombre = data.nombre.trim();
        }
        if (data.descripcion !== undefined) {
            updateFields.descripcion = (data.descripcion && typeof data.descripcion === "string" && data.descripcion.trim() !== "") ? data.descripcion.trim() : null;
        }
        if (data.icono !== undefined) {
            updateFields.icono = (data.icono && typeof data.icono === "string" && data.icono.trim() !== "") ? data.icono.trim() : null;
        }
        if (data.color !== undefined) {
            updateFields.color = (data.color && typeof data.color === "string" && data.color.trim() !== "") ? data.color.trim() : null;
        }

        const transaction = await sequelize.transaction();
        try {
            await categoria.update(updateFields, { transaction });
            await transaction.commit();
            return categoria;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async eliminarCategoria(negocioId, id) {
        if (!negocioId) {
            throw new AppError("No se ha identificado el negocio activo.", 400, "MISSING_TENANT_ID");
        }
        if (!id) {
            throw new AppError("ID de categoría es requerido.", 400, "MISSING_CATEGORY_ID");
        }
        const { sequelize, models } = await this._getModels(negocioId);
        const { CategoriaServicio } = models;

        const categoria = await CategoriaServicio.findOne({ where: { id, negocioId, activo: true } });
        if (!categoria) {
            throw new AppError("Categoría no encontrada.", 404, "CATEGORY_NOT_FOUND");
        }

        const transaction = await sequelize.transaction();
        try {
            await categoria.update({ activo: false }, { transaction });
            await transaction.commit();
            return { message: "Categoría eliminada correctamente." };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
}

export const categoriasService = new CategoriasService();
