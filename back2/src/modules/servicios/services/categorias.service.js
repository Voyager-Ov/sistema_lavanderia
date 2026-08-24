import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class CategoriasService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    async listarCategorias(negocioId) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { CategoriaServicio, Servicio } = await this._getModels(negocioId);

        const categorias = await CategoriaServicio.findAll({
            where: { activo: true },
            order: [["nombre", "ASC"]],
            include: [{
                model: Servicio,
                as: "servicios",
                where: { activo: true },
                required: false,
                attributes: ["id"]
            }]
        });

        return { items: categorias };
    }

    async crearCategoria(negocioId, data) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { CategoriaServicio } = await this._getModels(negocioId);

        if (!data.nombre || data.nombre.trim() === "") {
            throw new AppError("El nombre de la categoría es obligatorio.", 400, "MISSING_CATEGORY_NAME");
        }

        return await CategoriaServicio.create({
            nombre: data.nombre.trim(),
            descripcion: data.descripcion ? data.descripcion.trim() : null,
            icono: data.icono ? data.icono.trim() : "Tag",
            color: data.color ? data.color.trim() : "#2563eb",
            activo: true,
            negocioId
        });
    }

    async actualizarCategoria(negocioId, id, data) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        if (!id) {
            throw new AppError("ID de categoría es requerido.", 400, "MISSING_CATEGORY_ID");
        }
        const { CategoriaServicio } = await this._getModels(negocioId);

        const categoria = await CategoriaServicio.findOne({ where: { id, activo: true } });
        if (!categoria) {
            throw new AppError("Categoría no encontrada.", 404, "CATEGORY_NOT_FOUND");
        }

        const updateFields = {};
        if (data.nombre !== undefined) {
            if (data.nombre.trim() === "") {
                throw new AppError("El nombre de la categoría no puede estar vacío.", 400, "INVALID_CATEGORY_NAME");
            }
            updateFields.nombre = data.nombre.trim();
        }
        if (data.descripcion !== undefined) {
            updateFields.descripcion = data.descripcion ? data.descripcion.trim() : null;
        }
        if (data.icono !== undefined) {
            updateFields.icono = data.icono ? data.icono.trim() : "Tag";
        }
        if (data.color !== undefined) {
            updateFields.color = data.color ? data.color.trim() : "#2563eb";
        }

        await categoria.update(updateFields);

        return categoria;
    }

    async eliminarCategoria(negocioId, id) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        if (!id) {
            throw new AppError("ID de categoría es requerido.", 400, "MISSING_CATEGORY_ID");
        }
        const { CategoriaServicio } = await this._getModels(negocioId);

        const categoria = await CategoriaServicio.findOne({ where: { id, activo: true } });
        if (!categoria) {
            throw new AppError("Categoría no encontrada.", 404, "CATEGORY_NOT_FOUND");
        }

        await categoria.update({ activo: false });
        return { message: "Categoría eliminada correctamente." };
    }
}

export const categoriasService = new CategoriasService();
