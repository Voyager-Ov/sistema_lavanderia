import { Op } from "sequelize";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class ServiciosService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    // Listar servicios / productos con paginación, filtros y ordenamiento
    async listarServicios(negocioId, query) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Servicio, CategoriaServicio } = await this._getModels(negocioId);

        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;

        const where = { activo: true };

        // Filtro por término de búsqueda
        if (query.search && query.search.trim() !== "") {
            const searchOperator = process.env.NODE_ENV === "test" ? Op.like : Op.iLike;
            where[Op.or] = [
                { nombre: { [searchOperator]: `%${query.search.trim()}%` } },
                { descripcion: { [searchOperator]: `%${query.search.trim()}%` } }
            ];
        }

        // Filtro por categoría
        if (query.categoriaId && query.categoriaId !== "ALL") {
            where.categoriaId = query.categoriaId;
        }

        // Filtro por disponibilidad
        if (query.disponible !== undefined && query.disponible !== "ALL") {
            where.disponible = query.disponible === "true" || query.disponible === true;
        }

        // Ordenamiento
        const sortBy = query.sortBy || "id";
        const sortOrder = (query.sortOrder || "DESC").toUpperCase();

        const { count, rows } = await Servicio.findAndCountAll({
            where,
            include: [{
                model: CategoriaServicio,
                as: "categoria",
                attributes: ["id", "nombre", "icono", "color"]
            }],
            limit,
            offset,
            order: [[sortBy, sortOrder]],
            distinct: true
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

    // Estadísticas rápidas para el dashboard de servicios
    async obtenerEstadisticas(negocioId) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Servicio, CategoriaServicio } = await this._getModels(negocioId);

        const total = await Servicio.count({ where: { activo: true } });
        const activos = await Servicio.count({ where: { activo: true, disponible: true } });
        const categoriasCount = await CategoriaServicio.count({ where: { activo: true } });

        const primerServicio = await Servicio.findOne({
            where: { activo: true, disponible: true },
            order: [["id", "ASC"]]
        });

        return {
            total,
            activos,
            categorias: categoriasCount,
            masSolicitado: primerServicio ? primerServicio.nombre : "N/A"
        };
    }

    // Obtener servicio por ID
    async obtenerServicioPorId(negocioId, id) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Servicio, CategoriaServicio } = await this._getModels(negocioId);

        const servicio = await Servicio.findOne({
            where: { id, activo: true },
            include: [{
                model: CategoriaServicio,
                as: "categoria"
            }]
        });

        if (!servicio) {
            throw new AppError("Servicio no encontrado", 404, "SERVICE_NOT_FOUND");
        }

        return servicio;
    }

    // Crear nuevo servicio
    async crearServicio(negocioId, data, imagenPath = null) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Servicio, CategoriaServicio } = await this._getModels(negocioId);

        if (!data.nombre || !data.precioActual || !data.categoriaId) {
            throw new AppError("Nombre, precio y categoría son requeridos.", 400, "MISSING_REQUIRED_FIELDS");
        }

        const categoria = await CategoriaServicio.findByPk(data.categoriaId);
        if (!categoria) {
            throw new AppError("La categoría seleccionada no existe.", 400, "INVALID_CATEGORY");
        }

        const nuevoServicio = await Servicio.create({
            nombre: data.nombre,
            descripcion: data.descripcion || null,
            precioActual: parseFloat(data.precioActual),
            costoEstimado: parseFloat(data.costoEstimado || 0),
            tiempoEstimadoMinutos: parseInt(data.tiempoEstimadoMinutos || 0),
            disponible: data.disponible === "true" || data.disponible === true,
            activo: true,
            imagenUrl: imagenPath || data.imagenUrl || null,
            categoriaId: parseInt(data.categoriaId),
            negocioId
        });

        return this.obtenerServicioPorId(negocioId, nuevoServicio.id);
    }

    // Actualizar servicio existente
    async actualizarServicio(negocioId, id, data, imagenPath = null) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Servicio } = await this._getModels(negocioId);

        const servicio = await Servicio.findOne({ where: { id, activo: true } });
        if (!servicio) {
            throw new AppError("Servicio no encontrado para actualizar.", 404, "SERVICE_NOT_FOUND");
        }

        const updateFields = {};
        if (data.nombre !== undefined) updateFields.nombre = data.nombre;
        if (data.descripcion !== undefined) updateFields.descripcion = data.descripcion;
        if (data.precioActual !== undefined) updateFields.precioActual = parseFloat(data.precioActual);
        if (data.costoEstimado !== undefined) updateFields.costoEstimado = parseFloat(data.costoEstimado);
        if (data.tiempoEstimadoMinutos !== undefined) updateFields.tiempoEstimadoMinutos = parseInt(data.tiempoEstimadoMinutos);
        if (data.disponible !== undefined) updateFields.disponible = data.disponible === "true" || data.disponible === true;
        if (data.categoriaId !== undefined) updateFields.categoriaId = parseInt(data.categoriaId);
        if (imagenPath) updateFields.imagenUrl = imagenPath;

        await servicio.update(updateFields);

        return this.obtenerServicioPorId(negocioId, id);
    }

    // Eliminar servicio (soft delete)
    async eliminarServicio(negocioId, id) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Servicio } = await this._getModels(negocioId);

        const servicio = await Servicio.findOne({ where: { id } });
        if (!servicio) {
            throw new AppError("Servicio no encontrado para eliminar.", 404, "SERVICE_NOT_FOUND");
        }

        await servicio.update({ activo: false, disponible: false });
        return { message: "Servicio eliminado correctamente." };
    }
}

export const serviciosService = new ServiciosService();
