import { superAdminService } from "../services/superadmin.service.js";
import { successResponse } from "../../../utils/response.util.js";


export const getDashboard = async (req, res, next) => {
    try {
        const dashboardData = await superAdminService.getDashboard();
        return res.json(dashboardData);
    } catch (error) {
        next(error);
    }
};

export const getHealthCheck = async (req, res, next) => {
    try {
        const health = await superAdminService.runHealthCheck();
        return res.json(health);
    } catch (error) {
        next(error);
    }
};

export const getNegocios = async (req, res, next) => {
    try {
        const negocios = await superAdminService.listarNegocios();
        return successResponse(res, 200, "Negocios recuperados exitosamente", negocios);
    } catch (error) {
        next(error);
    }
};

export const updateStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { activo } = req.body;
        const negocio = await superAdminService.toggleEstadoNegocio(id, activo);
        return res.json(negocio);
    } catch (error) {
        next(error);
    }
};

export const updateEstadoSuscripcion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { estadoSuscripcion } = req.body;
        const negocio = await superAdminService.updateEstadoSuscripcion(id, estadoSuscripcion);
        return res.json(negocio);
    } catch (error) {
        next(error);
    }
};
