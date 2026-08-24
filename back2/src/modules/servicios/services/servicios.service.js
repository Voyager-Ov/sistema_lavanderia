import { Op } from "sequelize";
import { connectionManager } from "../../../models/connectionManager.js";
import { storageService } from "../../../services/storage.service.js";
import { AppError } from "../../../utils/appError.js";

class ServiciosService {

    async _getModels(negocioId) {
        const tenantDb = await connectionManager.getTenantDb(negocioId);
        return tenantDb.models;
    }

    // Listar servicios / productos con paginación, filtros y ordenamiento
    async listarServicios(negocioId, query = {}) {
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
            const catId = parseInt(query.categoriaId);
            if (!isNaN(catId) && catId > 0) {
                where.categoriaId = catId;
            }
        }

        // Filtro por disponibilidad
        if (query.disponible !== undefined && query.disponible !== "ALL") {
            where.disponible = query.disponible === "true" || query.disponible === true;
        }

        // Ordenamiento seguro
        let orderClause;
        const sortBy = query.sortBy || "id";
        const sortOrder = (query.sortOrder || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

        if (sortBy === "categoria" || sortBy === "categoria.nombre" || sortBy === "categoriaId") {
            orderClause = [[{ model: CategoriaServicio, as: "categoria" }, "nombre", sortOrder]];
        } else {
            const validAttributes = Object.keys(Servicio.rawAttributes);
            const targetSortBy = validAttributes.includes(sortBy) ? sortBy : "id";
            orderClause = [[targetSortBy, sortOrder]];
        }

        const { count, rows } = await Servicio.findAndCountAll({
            where,
            include: [{
                model: CategoriaServicio,
                as: "categoria",
                attributes: ["id", "nombre", "icono", "color"]
            }],
            limit,
            offset,
            order: orderClause,
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
        if (!id) {
            throw new AppError("ID de servicio es requerido.", 400, "MISSING_SERVICE_ID");
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
            throw new AppError("Servicio no encontrado.", 404, "SERVICE_NOT_FOUND");
        }

        return servicio;
    }

    // Crear nuevo servicio (Fail-Fast: exige precioActual canónico y valida categoriaId real)
    async crearServicio(negocioId, data, imagenPath = null) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        const { Servicio, CategoriaServicio, HistorialPrecioServicio } = await this._getModels(negocioId);

        if (!data.nombre || data.nombre.trim() === "") {
            throw new AppError("El nombre del servicio es obligatorio.", 400, "MISSING_SERVICE_NAME");
        }

        if (data.precioActual === undefined || data.precioActual === null || data.precioActual === "") {
            throw new AppError("El precio actual es obligatorio.", 400, "MISSING_PRICE");
        }

        const precioNum = parseFloat(data.precioActual);
        if (isNaN(precioNum) || precioNum < 0) {
            throw new AppError("El precio actual debe ser un número mayor o igual a 0.", 400, "INVALID_PRICE");
        }

        let catId = null;
        if (data.categoriaId !== undefined && data.categoriaId !== null && data.categoriaId !== "") {
            const parsedCatId = parseInt(data.categoriaId);
            if (isNaN(parsedCatId) || parsedCatId <= 0) {
                throw new AppError("El ID de categoría debe ser un número entero positivo válido.", 400, "INVALID_CATEGORY_ID");
            }
            const categoria = await CategoriaServicio.findOne({ where: { id: parsedCatId, activo: true } });
            if (!categoria) {
                throw new AppError("La categoría seleccionada no existe.", 404, "CATEGORY_NOT_FOUND");
            }
            catId = parsedCatId;
        }

        if (imagenPath) {
            const fotosActuales = await Servicio.count({
                where: { activo: true, imagenUrl: { [Op.ne]: null } }
            });
            if (fotosActuales >= 30) {
                await storageService.deleteFile(imagenPath);
                throw new AppError(
                    "Este negocio ha alcanzado el límite máximo permitido de 30 imágenes de servicios activos.",
                    400,
                    "TENANT_PHOTO_LIMIT_EXCEEDED"
                );
            }
        }

        const nuevoServicio = await Servicio.create({
            nombre: data.nombre.trim(),
            descripcion: data.descripcion ? data.descripcion.trim() : null,
            precioActual: precioNum,
            costoEstimado: data.costoEstimado !== undefined && data.costoEstimado !== "" ? parseFloat(data.costoEstimado) : 0,
            tiempoEstimadoMinutos: data.tiempoEstimadoMinutos !== undefined && data.tiempoEstimadoMinutos !== "" ? parseInt(data.tiempoEstimadoMinutos) : 0,
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
        if (!id) {
            throw new AppError("ID de servicio es requerido.", 400, "MISSING_SERVICE_ID");
        }
        const { Servicio, CategoriaServicio, HistorialPrecioServicio } = await this._getModels(negocioId);

        const servicio = await Servicio.findOne({ where: { id, activo: true } });
        if (!servicio) {
            throw new AppError("Servicio no encontrado para actualizar.", 404, "SERVICE_NOT_FOUND");
        }

        const updateFields = {};
        if (data.nombre !== undefined) {
            if (data.nombre.trim() === "") throw new AppError("El nombre del servicio no puede estar vacío.", 400, "INVALID_NAME");
            updateFields.nombre = data.nombre.trim();
        }
        if (data.descripcion !== undefined) updateFields.descripcion = data.descripcion ? data.descripcion.trim() : null;
        if (data.costoEstimado !== undefined && data.costoEstimado !== "") updateFields.costoEstimado = parseFloat(data.costoEstimado);
        if (data.tiempoEstimadoMinutos !== undefined && data.tiempoEstimadoMinutos !== "") updateFields.tiempoEstimadoMinutos = parseInt(data.tiempoEstimadoMinutos);
        if (data.disponible !== undefined) updateFields.disponible = data.disponible === "true" || data.disponible === true;
        
        if (data.categoriaId !== undefined && data.categoriaId !== null && data.categoriaId !== "") {
            const parsedCatId = parseInt(data.categoriaId);
            if (isNaN(parsedCatId) || parsedCatId <= 0) {
                throw new AppError("El ID de categoría debe ser un número entero positivo válido.", 400, "INVALID_CATEGORY_ID");
            }
            const categoria = await CategoriaServicio.findOne({ where: { id: parsedCatId, activo: true } });
            if (!categoria) {
                throw new AppError("La categoría seleccionada no existe.", 404, "CATEGORY_NOT_FOUND");
            }
            updateFields.categoriaId = parsedCatId;
        }

        if (imagenPath) {
            const yaTeniaFoto = Boolean(servicio.imagenUrl);
            if (!yaTeniaFoto) {
                const fotosActuales = await Servicio.count({
                    where: { activo: true, imagenUrl: { [Op.ne]: null } }
                });
                if (fotosActuales >= 30) {
                    await storageService.deleteFile(imagenPath);
                    throw new AppError(
                        "Este negocio ha alcanzado el límite máximo permitido de 30 imágenes de servicios activos.",
                        400,
                        "TENANT_PHOTO_LIMIT_EXCEEDED"
                    );
                }
            }
            if (servicio.imagenUrl && servicio.imagenUrl !== imagenPath) {
                await storageService.deleteFile(servicio.imagenUrl);
            }
            updateFields.imagenUrl = imagenPath;
        } else if (data.eliminarImagen === "true" || data.eliminarImagen === true || data.imagenUrl === "") {
            if (servicio.imagenUrl) {
                await storageService.deleteFile(servicio.imagenUrl);
            }
            updateFields.imagenUrl = null;
        }

        if (data.precioActual !== undefined && data.precioActual !== null && data.precioActual !== "") {
            const nuevoPrecio = parseFloat(data.precioActual);
            if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
                throw new AppError("El precio actual debe ser un número mayor o igual a 0.", 400, "INVALID_PRICE");
            }

            if (nuevoPrecio !== parseFloat(servicio.precioActual)) {
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
        }

        await servicio.update(updateFields);

        return this.obtenerServicioPorId(negocioId, id);
    }

    // Cambiar disponibilidad individual
    async cambiarDisponibilidad(negocioId, id, disponible) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        if (!id) {
            throw new AppError("ID de servicio es requerido.", 400, "MISSING_SERVICE_ID");
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

    // Actualizar precios de forma masiva (Fail-Fast y validación estricta del array de servicios)
    async actualizarPreciosMasivo(negocioId, servicios) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        if (!Array.isArray(servicios) || servicios.length === 0) {
            throw new AppError("Se requiere un arreglo de 'servicios' no vacío para actualizar precios.", 400, "INVALID_BULK_DATA");
        }

        const { Servicio, HistorialPrecioServicio } = await this._getModels(negocioId);
        const resultados = [];
        const ahora = new Date();

        for (const item of servicios) {
            if (!item.id || item.precioActual === undefined || isNaN(parseFloat(item.precioActual)) || parseFloat(item.precioActual) < 0) {
                throw new AppError(`El servicio ID ${item?.id || 'desconocido'} no contiene un precioActual válido.`, 400, "INVALID_SERVICE_ITEM");
            }
            const servicio = await Servicio.findOne({ where: { id: item.id, activo: true } });
            if (!servicio) {
                throw new AppError(`Servicio con ID ${item.id} no encontrado o inactivo.`, 404, "SERVICE_NOT_FOUND");
            }

            const nuevoPrecio = parseFloat(item.precioActual);
            if (nuevoPrecio !== parseFloat(servicio.precioActual)) {
                await servicio.update({ precioActual: nuevoPrecio });

                if (HistorialPrecioServicio) {
                    try {
                        await HistorialPrecioServicio.update(
                            { fechaHasta: ahora },
                            { where: { servicioId: item.id, negocioId, fechaHasta: null } }
                        );
                        await HistorialPrecioServicio.create({
                            servicioId: item.id,
                            precio: nuevoPrecio,
                            fechaDesde: ahora,
                            fechaHasta: null,
                            motivo: "Ajuste Masivo de Precios",
                            negocioId
                        });
                    } catch (e) {
                        console.warn("⚠️ No se pudo registrar historial masivo:", e.message);
                    }
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
            throw new AppError("Se requiere un arreglo de IDs válido y no vacío.", 400, "INVALID_IDS");
        }

        const { Servicio } = await this._getModels(negocioId);
        const isDisponible = disponible === "true" || disponible === true;

        const [affectedCount] = await Servicio.update(
            { disponible: isDisponible },
            { where: { id: { [Op.in]: ids }, activo: true } }
        );

        return { count: affectedCount };
    }

    // Obtener historial de precios de un servicio
    async obtenerHistorialPrecios(negocioId, id) {
        if (!negocioId) {
            throw new AppError("ID de negocio es requerido.", 400, "MISSING_TENANT_ID");
        }
        if (!id) {
            throw new AppError("ID de servicio es requerido.", 400, "MISSING_SERVICE_ID");
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
        if (!id) {
            throw new AppError("ID de servicio es requerido.", 400, "MISSING_SERVICE_ID");
        }
        const { Servicio } = await this._getModels(negocioId);

        const servicio = await Servicio.findOne({ where: { id, activo: true } });
        if (!servicio) {
            throw new AppError("Servicio no encontrado para eliminar.", 404, "SERVICE_NOT_FOUND");
        }

        await servicio.update({ activo: false, disponible: false });
        return { message: "Servicio eliminado correctamente." };
    }
}

export const serviciosService = new ServiciosService();
