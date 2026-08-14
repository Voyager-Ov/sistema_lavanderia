import { connectionManager } from "../../../models/connectionManager.js";
import { AppError } from "../../../utils/appError.js";

class SuperAdminService {
    async getDashboard() {
        const Negocio = connectionManager.centralModels.Negocio;

        const negocios = await Negocio.findAll({
            order: [["createdAt", "DESC"]]
        });

        return {
            negocios,
            stats: {
                totalNegocios: negocios.length,
                activos: negocios.filter(n => n.activo).length,
                inactivos: negocios.filter(n => !n.activo).length
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
        const Negocio = connectionManager.centralModels.Negocio;
        return await Negocio.findAll({
            order: [["createdAt", "DESC"]]
        });
    }

    async toggleEstadoNegocio(id, activo) {
        const Negocio = connectionManager.centralModels.Negocio;
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
        const Negocio = connectionManager.centralModels.Negocio;
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
}

export const superAdminService = new SuperAdminService();
