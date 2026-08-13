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

        if (!data.nombre) {
            throw new AppError("El nombre de la categoría es requerido.", 400, "MISSING_CATEGORY_NAME");
        }

        return await CategoriaServicio.create({
            nombre: data.nombre,
            descripcion: data.descripcion || null,
            icono: data.icono || "Tag",
            color: data.color || "#2563eb",
            activo: true,
            negocioId
        });
    }

    async actualizarCategoria(negocioId, id, data) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { CategoriaServicio } = await this._getModels(negocioId);

        const categoria = await CategoriaServicio.findByPk(id);
        if (!categoria) {
            throw new AppError("Categoría no encontrada.", 404, "CATEGORY_NOT_FOUND");
        }

        await categoria.update({
            nombre: data.nombre !== undefined ? data.nombre : categoria.nombre,
            descripcion: data.descripcion !== undefined ? data.descripcion : categoria.descripcion,
            icono: data.icono !== undefined ? data.icono : categoria.icono,
            color: data.color !== undefined ? data.color : categoria.color
        });

        return categoria;
    }

    async eliminarCategoria(negocioId, id) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { CategoriaServicio } = await this._getModels(negocioId);

        const categoria = await CategoriaServicio.findByPk(id);
        if (!categoria) {
            throw new AppError("Categoría no encontrada.", 404, "CATEGORY_NOT_FOUND");
        }

        await categoria.update({ activo: false });
        return { message: "Categoría eliminada correctamente." };
    }
}

export const categoriasService = new CategoriasService();
