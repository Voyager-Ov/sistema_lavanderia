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

// --- Controladores para Solicitudes de Negocio ---

export const getSolicitudes = async (req, res, next) => {
    try {
        const { estado } = req.query;
        const solicitudes = await superAdminService.listarSolicitudes(estado);
        return successResponse(res, 200, "Solicitudes recuperadas exitosamente", solicitudes);
    } catch (error) {
        next(error);
    }
};

export const aprobarSolicitud = async (req, res, next) => {
    try {
        const { id } = req.params;
        const superadminEmail = req.user?.email || "octavio.velo2022@gmail.com";
        const resultado = await superAdminService.aprobarSolicitud(id, superadminEmail);
        return successResponse(res, 200, "Solicitud aprobada y negocio aprovisionado exitosamente", resultado);
    } catch (error) {
        next(error);
    }
};

export const rechazarSolicitud = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        const superadminEmail = req.user?.email || "octavio.velo2022@gmail.com";
        const resultado = await superAdminService.rechazarSolicitud(id, motivo, superadminEmail);
        return successResponse(res, 200, "Solicitud rechazada exitosamente", resultado);
    } catch (error) {
        next(error);
    }
};

// --- Controladores para Almacenamiento, Cuotas e Imágenes ---

export const getNegocioAlmacenamiento = async (req, res, next) => {
    try {
        const { id } = req.params;
        const metricas = await superAdminService.getNegocioAlmacenamiento(id);
        return successResponse(res, 200, "Métricas de almacenamiento recuperadas exitosamente", metricas);
    } catch (error) {
        next(error);
    }
};

export const updateNegocioLimites = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { maxImagenes, maxStorageGB } = req.body;
        const negocio = await superAdminService.updateNegocioLimites(id, { maxImagenes, maxStorageGB });
        return successResponse(res, 200, "Límites de almacenamiento actualizados exitosamente", negocio);
    } catch (error) {
        next(error);
    }
};

export const getNegocioImagenes = async (req, res, next) => {
    try {
        const { id } = req.params;
        const imagenes = await superAdminService.listarImagenesTenant(id);
        return successResponse(res, 200, "Imágenes del negocio recuperadas exitosamente", imagenes);
    } catch (error) {
        next(error);
    }
};

export const deleteNegocioImagenes = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { filePaths } = req.body;
        const resultado = await superAdminService.eliminarImagenesTenant(id, filePaths);
        return successResponse(res, 200, "Imágenes eliminadas exitosamente", resultado);
    } catch (error) {
        next(error);
    }
};

// --- Controladores para Mensajería Broadcast ---

export const createMensaje = async (req, res, next) => {
    try {
        const { titulo, contenido, tipo, negocioId } = req.body;
        const creadoPor = req.user?.email || "SUPER_ADMIN";
        const mensaje = await superAdminService.crearMensajeBroadcast({ titulo, contenido, tipo, negocioId, creadoPor });
        return successResponse(res, 201, "Mensaje broadcast publicado exitosamente", mensaje);
    } catch (error) {
        next(error);
    }
};

export const getMensajes = async (req, res, next) => {
    try {
        const mensajes = await superAdminService.listarMensajesBroadcast();
        return successResponse(res, 200, "Mensajes recuperados exitosamente", mensajes);
    } catch (error) {
        next(error);
    }
};

export const desactivarMensaje = async (req, res, next) => {
    try {
        const { id } = req.params;
        const mensaje = await superAdminService.desactivarMensaje(id);
        return successResponse(res, 200, "Mensaje desactivado exitosamente", mensaje);
    } catch (error) {
        next(error);
    }
};

// --- Controladores para Auditoría de Seguridad ---

export const getLogsSeguridad = async (req, res, next) => {
    try {
        const logs = await superAdminService.listarLogsSeguridad();
        return successResponse(res, 200, "Logs de seguridad recuperados exitosamente", logs);
    } catch (error) {
        next(error);
    }
};
