import fs from "fs";
import path from "path";
import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";
import { registerService } from "../../auth/services/register.service.js";

class SuperAdminService {
    async login(email, password) {
        const { loginService } = await import("../../auth/services/login.service.js");
        return await loginService.login({ email, password });
    }

    async getDashboard() {
        const { Negocio, SolicitudNegocio } = connectionManager.centralModels;

        const negocios = await Negocio.findAll({
            order: [["createdAt", "DESC"]]
        });

        let solicitudesPendientesCount = 0;
        if (SolicitudNegocio) {
            solicitudesPendientesCount = await SolicitudNegocio.count({
                where: { estado: "PENDIENTE" }
            });
        }

        // Agregar métricas de almacenamiento calculadas por cada negocio
        const negociosConMétricas = await Promise.all(
            negocios.map(async (negocio) => {
                const metricas = await this.getNegocioAlmacenamiento(negocio.id);
                return {
                    ...negocio.toJSON(),
                    metricasAlmacenamiento: metricas
                };
            })
        );

        return {
            negocios: negociosConMétricas,
            stats: {
                totalNegocios: negocios.length,
                activos: negocios.filter(n => n.activo).length,
                inactivos: negocios.filter(n => !n.activo).length,
                solicitudesPendientes: solicitudesPendientesCount
            }
        };
    }

    async runHealthCheck() {
        let dbStatus = "DOWN";
        try {
            await connectionManager.centralDb.authenticate();
            dbStatus = "UP";
        } catch (e) {
            dbStatus = "DOWN";
        }

        return {
            timestamp: new Date(),
            status: dbStatus === "UP" ? "HEALTHY" : "DEGRADED",
            database: dbStatus,
            services: {
                api: "UP",
                centralDb: dbStatus
            }
        };
    }

    async listarNegocios() {
        const { Negocio } = connectionManager.centralModels;
        const negocios = await Negocio.findAll({
            order: [["createdAt", "DESC"]]
        });

        return await Promise.all(
            negocios.map(async (negocio) => {
                const metricas = await this.getNegocioAlmacenamiento(negocio.id);
                return {
                    ...negocio.toJSON(),
                    metricasAlmacenamiento: metricas
                };
            })
        );
    }

    async toggleEstadoNegocio(id, activo) {
        const { Negocio } = connectionManager.centralModels;
        const negocio = await Negocio.findByPk(id);
        if (!negocio) {
            throw new AppError("Negocio no encontrado", 404, "NOT_FOUND");
        }

        if (activo !== undefined) {
            negocio.activo = Boolean(activo);
            if (!negocio.activo) {
                negocio.estadoSuscripcion = "SUSPENDIDA";
            } else if (negocio.estadoSuscripcion === "SUSPENDIDA") {
                negocio.estadoSuscripcion = "ACTIVA";
            }
        }
        await negocio.save();
        return negocio;
    }

    async updateEstadoSuscripcion(id, estadoSuscripcion) {
        const { Negocio } = connectionManager.centralModels;
        const negocio = await Negocio.findByPk(id);
        if (!negocio) {
            throw new AppError("Negocio no encontrado", 404, "NOT_FOUND");
        }

        negocio.estadoSuscripcion = estadoSuscripcion;
        if (estadoSuscripcion === "SUSPENDIDA") {
            negocio.activo = false;
        } else if (estadoSuscripcion === "ACTIVA" || estadoSuscripcion === "PRUEBA") {
            negocio.activo = true;
        }
        await negocio.save();
        return negocio;
    }

    // --- Solicitudes de Registro de Negocio ---

    async listarSolicitudes(estado) {
        const { SolicitudNegocio } = connectionManager.centralModels;
        if (!SolicitudNegocio) return [];

        const where = estado ? { estado } : {};
        return await SolicitudNegocio.findAll({
            where,
            order: [["createdAt", "DESC"]]
        });
    }

    async aprobarSolicitud(solicitudId, superadminEmail) {
        return await registerService.sustanciarAprobacionNegocio(solicitudId, superadminEmail);
    }

    async rechazarSolicitud(solicitudId, motivo, superadminEmail) {
        return await registerService.rechazarSolicitudNegocio(solicitudId, motivo, superadminEmail);
    }

    // --- Almacenamiento y Gestión de Cuotas / Imágenes por Tenant ---

    async getNegocioAlmacenamiento(negocioId) {
        const { Negocio } = connectionManager.centralModels;
        const negocio = await Negocio.findByPk(negocioId);
        if (!negocio) {
            throw new AppError("Negocio no encontrado", 404, "NOT_FOUND");
        }

        const maxImagenes = negocio.maxImagenes || 50;
        const maxStorageGB = negocio.maxStorageGB || 1.0;

        // Calcular espacio utilizado inspeccionando archivos en public/uploads y uploads/${negocioId}
        const uploadsBase = path.join(process.cwd(), "public", "uploads");
        const tenantFolder = path.join(uploadsBase, String(negocioId));

        let totalSizeBytes = 0;
        let imageFilesCount = 0;

        const scanDirectory = (dirPath) => {
            if (!fs.existsSync(dirPath)) return;
            const items = fs.readdirSync(dirPath, { withFileTypes: true });
            for (const item of items) {
                const fullPath = path.join(dirPath, item.name);
                if (item.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (item.isFile()) {
                    const stat = fs.statSync(fullPath);
                    totalSizeBytes += stat.size;
                    const ext = path.extname(item.name).toLowerCase();
                    if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext)) {
                        imageFilesCount++;
                    }
                }
            }
        };

        if (fs.existsSync(tenantFolder)) {
            scanDirectory(tenantFolder);
        } else if (fs.existsSync(uploadsBase)) {
            // Scan base uploads directory for files matching tenant ID or general files
            const baseItems = fs.readdirSync(uploadsBase, { withFileTypes: true });
            for (const item of baseItems) {
                if (item.isFile()) {
                    const ext = path.extname(item.name).toLowerCase();
                    if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext)) {
                        if (item.name.includes(`negocio_${negocioId}_`) || item.name.includes(`tenant_${negocioId}_`)) {
                            const stat = fs.statSync(path.join(uploadsBase, item.name));
                            totalSizeBytes += stat.size;
                            imageFilesCount++;
                        }
                    }
                }
            }
        }

        const storageConsumidoMB = parseFloat((totalSizeBytes / (1024 * 1024)).toFixed(2));
        const maxStorageMB = maxStorageGB * 1024;
        const porcentajeAlmacenamiento = parseFloat(((storageConsumidoMB / maxStorageMB) * 100).toFixed(2));

        return {
            negocioId: negocio.id,
            nombreNegocio: negocio.nombre || negocio.razonSocial,
            totalImagenes: imageFilesCount,
            maxImagenes,
            storageConsumidoMB,
            totalSizeBytes,
            maxStorageGB,
            porcentajeAlmacenamiento
        };
    }

    async updateNegocioLimites(negocioId, { maxImagenes, maxStorageGB }) {
        const { Negocio } = connectionManager.centralModels;
        const negocio = await Negocio.findByPk(negocioId);
        if (!negocio) {
            throw new AppError("Negocio no encontrado", 404, "NOT_FOUND");
        }

        if (maxImagenes !== undefined) {
            negocio.maxImagenes = Math.max(1, parseInt(maxImagenes, 10));
        }
        if (maxStorageGB !== undefined) {
            negocio.maxStorageGB = Math.max(0.1, parseFloat(maxStorageGB));
        }

        await negocio.save();
        return negocio;
    }

    async listarImagenesTenant(negocioId) {
        const uploadsBase = path.join(process.cwd(), "public", "uploads");
        const tenantFolder = path.join(uploadsBase, String(negocioId));
        const imagenes = [];

        const collectImages = (dirPath, relPrefix = "") => {
            if (!fs.existsSync(dirPath)) return;
            const items = fs.readdirSync(dirPath, { withFileTypes: true });
            for (const item of items) {
                const fullPath = path.join(dirPath, item.name);
                if (item.isDirectory()) {
                    collectImages(fullPath, `${relPrefix}/${item.name}`);
                } else if (item.isFile()) {
                    const ext = path.extname(item.name).toLowerCase();
                    if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext)) {
                        const stat = fs.statSync(fullPath);
                        const relativeUrl = `/uploads/${negocioId}${relPrefix}/${item.name}`;
                        imagenes.push({
                            id: Buffer.from(fullPath).toString("base64"),
                            filename: item.name,
                            fullPath,
                            url: relativeUrl,
                            sizeBytes: stat.size,
                            sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
                            createdAt: stat.birthtime || stat.mtime
                        });
                    }
                }
            }
        };

        if (fs.existsSync(tenantFolder)) {
            collectImages(tenantFolder);
        } else if (fs.existsSync(uploadsBase)) {
            const baseItems = fs.readdirSync(uploadsBase, { withFileTypes: true });
            for (const item of baseItems) {
                if (item.isFile()) {
                    const ext = path.extname(item.name).toLowerCase();
                    if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext)) {
                        if (item.name.includes(`negocio_${negocioId}_`) || item.name.includes(`tenant_${negocioId}_`)) {
                            const fullPath = path.join(uploadsBase, item.name);
                            const stat = fs.statSync(fullPath);
                            imagenes.push({
                                id: Buffer.from(fullPath).toString("base64"),
                                filename: item.name,
                                fullPath,
                                url: `/uploads/${item.name}`,
                                sizeBytes: stat.size,
                                sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
                                createdAt: stat.birthtime || stat.mtime
                            });
                        }
                    }
                }
            }
        }

        return imagenes;
    }

    async eliminarImagenesTenant(negocioId, fileIdsOrPaths = []) {
        if (!Array.isArray(fileIdsOrPaths) || fileIdsOrPaths.length === 0) {
            throw new AppError("Debes especificar al menos un archivo para eliminar.", 400, "MISSING_FILES");
        }

        let eliminadosCount = 0;
        for (const identifier of fileIdsOrPaths) {
            let targetPath = identifier;
            // Si el identificador es base64, decodificarlo
            try {
                const decoded = Buffer.from(identifier, "base64").toString("utf-8");
                if (fs.existsSync(decoded)) {
                    targetPath = decoded;
                }
            } catch (e) {
                // Not base64
            }

            if (fs.existsSync(targetPath)) {
                fs.unlinkSync(targetPath);
                eliminadosCount++;
            }
        }

        return {
            negocioId,
            eliminadosCount,
            mensaje: `${eliminadosCount} imágenes eliminadas exitosamente.`
        };
    }

    // --- Métodos de Mensajería Broadcast ---

    async crearMensajeBroadcast({ titulo, contenido, tipo = "INFO", negocioId = null, creadoPor = "SUPER_ADMIN" }) {
        const { MensajeSistema } = connectionManager.centralModels;
        if (!titulo || !contenido) {
            throw new AppError("El título y contenido del mensaje son requeridos.", 400, "MISSING_FIELDS");
        }

        const mensaje = await MensajeSistema.create({
            titulo: titulo.trim(),
            contenido: contenido.trim(),
            tipo,
            negocioId: negocioId ? Number(negocioId) : null,
            activo: true,
            creadoPor
        });

        return mensaje;
    }

    async listarMensajesBroadcast() {
        const { MensajeSistema } = connectionManager.centralModels;
        const mensajes = await MensajeSistema.findAll({
            order: [["createdAt", "DESC"]]
        });
        return mensajes;
    }

    async desactivarMensaje(mensajeId) {
        const { MensajeSistema } = connectionManager.centralModels;
        const mensaje = await MensajeSistema.findByPk(mensajeId);
        if (!mensaje) {
            throw new AppError("Mensaje no encontrado", 404, "NOT_FOUND");
        }
        mensaje.activo = false;
        await mensaje.save();
        return mensaje;
    }

    async listarAnunciosActivosTenant(negocioId = null) {
        const { MensajeSistema } = connectionManager.centralModels;
        const Op = connectionManager.centralDb ? connectionManager.centralDb.Sequelize.Op : null;
        
        const whereClause = {
            activo: true
        };

        if (negocioId) {
            whereClause[Op ? Op.or : "or"] = [
                { negocioId: null },
                { negocioId: Number(negocioId) }
            ];
        } else {
            whereClause.negocioId = null;
        }

        const mensajes = await MensajeSistema.findAll({
            where: whereClause,
            order: [["createdAt", "DESC"]]
        });

        return mensajes;
    }

    // --- Métodos de Auditoría y Seguridad ---

    async listarLogsSeguridad() {
        const { AlertaSeguridad } = connectionManager.centralModels;
        if (!AlertaSeguridad) return [];
        const logs = await AlertaSeguridad.findAll({
            order: [["createdAt", "DESC"]],
            limit: 100
        });
        return logs;
    }
}

export const superAdminService = new SuperAdminService();
