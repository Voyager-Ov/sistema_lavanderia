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
        const { Servicio, CategoriaServicio, HistorialPrecioServicio } = await this._getModels(negocioId);

        const precioFinal = data.precioActual !== undefined ? data.precioActual : data.precio;
        if (!data.nombre || precioFinal === undefined || precioFinal === null) {
            throw new AppError("Nombre y precio son requeridos.", 400, "MISSING_REQUIRED_FIELDS");
        }

        let catId = data.categoriaId ? parseInt(data.categoriaId) : null;
        if (catId) {
            const categoria = await CategoriaServicio.findByPk(catId);
            if (!categoria) {
                let defaultCat = await CategoriaServicio.findOne({ where: { activo: true } });
                if (!defaultCat) {
                    defaultCat = await CategoriaServicio.create({ nombre: "General", activo: true });
                }
                catId = defaultCat.id;
            }
        } else {
            let defaultCat = await CategoriaServicio.findOne({ where: { activo: true } });
            if (!defaultCat) {
                defaultCat = await CategoriaServicio.create({ nombre: "General", activo: true });
            }
            catId = defaultCat.id;
        }

        const precioNum = parseFloat(precioFinal);

        const nuevoServicio = await Servicio.create({
            nombre: data.nombre,
            descripcion: data.descripcion || null,
            precioActual: precioNum,
            costoEstimado: parseFloat(data.costoEstimado || 0),
            tiempoEstimadoMinutos: parseInt(data.tiempoEstimadoMinutos || 0),
            disponible: data.disponible === "true" || data.disponible === true || data.disponible === undefined,
            activo: true,
            imagenUrl: imagenPath || data.imagenUrl || null,
            categoriaId: catId,
            negocioId
        });

        // Registrar precio inicial en historial
        try {
            await HistorialPrecioServicio.create({
                servicioId: nuevoServicio.id,
                precio: precioNum,
                fechaDesde: new Date(),
                fechaHasta: null,
                motivo: "Precio Inicial",
                negocioId
            });
        } catch (e) {
            console.warn("⚠️ No se pudo guardar historial inicial:", e.message);
        }

        return this.obtenerServicioPorId(negocioId, nuevoServicio.id);
    }

    // Actualizar servicio existente
    async actualizarServicio(negocioId, id, data, imagenPath = null) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Servicio, HistorialPrecioServicio } = await this._getModels(negocioId);

        const servicio = await Servicio.findOne({ where: { id, activo: true } });
        if (!servicio) {
            throw new AppError("Servicio no encontrado para actualizar.", 404, "SERVICE_NOT_FOUND");
        }

        const updateFields = {};
        if (data.nombre !== undefined) updateFields.nombre = data.nombre;
        if (data.descripcion !== undefined) updateFields.descripcion = data.descripcion;
        if (data.costoEstimado !== undefined) updateFields.costoEstimado = parseFloat(data.costoEstimado);
        if (data.tiempoEstimadoMinutos !== undefined) updateFields.tiempoEstimadoMinutos = parseInt(data.tiempoEstimadoMinutos);
        if (data.disponible !== undefined) updateFields.disponible = data.disponible === "true" || data.disponible === true;
        if (data.categoriaId !== undefined) updateFields.categoriaId = parseInt(data.categoriaId);
        if (imagenPath) updateFields.imagenUrl = imagenPath;

        let nuevoPrecio = data.precioActual !== undefined ? parseFloat(data.precioActual) : (data.precio !== undefined ? parseFloat(data.precio) : undefined);

        if (nuevoPrecio !== undefined && nuevoPrecio !== parseFloat(servicio.precioActual)) {
            updateFields.precioActual = nuevoPrecio;

            // Cerrar precio previo e insertar nuevo en historial
            const ahora = new Date();
            try {
                await HistorialPrecioServicio.update(
                    { fechaHasta: ahora },
                    { where: { servicioId: id, negocioId, fechaHasta: null } }
                );
                await HistorialPrecioServicio.create({
                    servicioId: id,
                    precio: nuevoPrecio,
                    fechaDesde: ahora,
                    fechaHasta: null,
                    motivo: data.motivo || "Edición de precio",
                    negocioId
                });
            } catch (e) {
                console.warn("⚠️ No se pudo actualizar historial de precio:", e.message);
            }
        }

        await servicio.update(updateFields);

        return this.obtenerServicioPorId(negocioId, id);
    }

    // Cambiar disponibilidad individual
    async cambiarDisponibilidad(negocioId, id, disponible) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Servicio } = await this._getModels(negocioId);

        const servicio = await Servicio.findOne({ where: { id, activo: true } });
        if (!servicio) {
            throw new AppError("Servicio no encontrado.", 404, "SERVICE_NOT_FOUND");
        }

        const isDisponible = disponible === "true" || disponible === true;
        await servicio.update({ disponible: isDisponible });

        return servicio;
    }

    // Actualizar precios de forma masiva
    async actualizarPreciosMasivo(negocioId, updates) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        if (!Array.isArray(updates) || updates.length === 0) {
            throw new AppError("Se requiere un arreglo de actualizaciones de precios válidos.", 400, "INVALID_BULK_DATA");
        }

        const { Servicio, HistorialPrecioServicio } = await this._getModels(negocioId);
        const resultados = [];
        const ahora = new Date();

        for (const u of updates) {
            if (!u.id || u.precioActual === undefined || isNaN(parseFloat(u.precioActual)) || parseFloat(u.precioActual) < 0) {
                continue;
            }
            const servicio = await Servicio.findOne({ where: { id: u.id, activo: true, negocioId } });
            if (!servicio) continue;

            const nuevoPrecio = parseFloat(u.precioActual);
            if (nuevoPrecio !== undefined && nuevoPrecio !== parseFloat(servicio.precioActual)) {
                await servicio.update({ precioActual: nuevoPrecio });

                // Registrar en historial si la tabla y modelo existen
                if (HistorialPrecioServicio) {
                    try {
                        await HistorialPrecioServicio.update(
                            { fechaHasta: ahora },
                            { where: { servicioId: u.id, negocioId, fechaHasta: null } }
                        );
                        await HistorialPrecioServicio.create({
                            servicioId: u.id,
                            precio: nuevoPrecio,
                            fechaDesde: ahora,
                            fechaHasta: null,
                            motivo: "Ajuste Masivo de Precios",
                            negocioId
                        });
                    } catch (e) {}
                }
            }
            resultados.push(servicio);
        }

        return { count: resultados.length, items: resultados };
    }

    // Actualizar disponibilidad masiva
    async actualizarDisponibilidadMasiva(negocioId, ids, disponible) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new AppError("Se requiere un arreglo de IDs válidos.", 400, "INVALID_IDS");
        }

        const { Servicio } = await this._getModels(negocioId);
        const isDisponible = disponible === "true" || disponible === true;

        const [affectedCount] = await Servicio.update(
            { disponible: isDisponible },
            { where: { id: { [Op.in]: ids }, activo: true, negocioId } }
        );

        return { count: affectedCount };
    }

    // Obtener historial de precios de un servicio
    async obtenerHistorialPrecios(negocioId, id) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Servicio, HistorialPrecioServicio } = await this._getModels(negocioId);

        const servicio = await Servicio.findOne({ where: { id, activo: true } });
        if (!servicio) {
            throw new AppError("Servicio no encontrado.", 404, "SERVICE_NOT_FOUND");
        }

        let historial = [];
        try {
            historial = await HistorialPrecioServicio.findAll({
                where: { servicioId: id, negocioId },
                order: [["fechaDesde", "ASC"]]
            });
        } catch (e) {
            console.warn("⚠️ No se pudo consultar historial en la BD:", e.message);
        }

        // Si no hay registros aún en el historial, devolvemos un registro sintético basado en el servicio actual
        if (historial.length === 0) {
            const p = parseFloat(servicio.precioActual);
            historial = [
                {
                    id: 1,
                    precio: p,
                    precioNuevo: p,
                    precioAnterior: p,
                    fechaCambio: servicio.createdAt,
                    createdAt: servicio.createdAt,
                    motivo: "Precio Inicial"
                }
            ];
        } else {
            historial = historial.map((h, idx) => {
                const p = parseFloat(h.precio);
                const prev = idx > 0 ? parseFloat(historial[idx - 1].precio) : p;
                return {
                    id: h.id,
                    precio: p,
                    precioNuevo: p,
                    precioAnterior: prev,
                    fechaCambio: h.fechaDesde,
                    createdAt: h.fechaDesde,
                    fechaDesde: h.fechaDesde,
                    fechaHasta: h.fechaHasta,
                    motivo: h.motivo || "Cambio de precio"
                };
            });
        }

        return historial;
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

