import * as reporteService from "../../services/rrhh/reporte.service.js";
import { successResponse } from "../../utils/response.util.js";

export const getReporteMensual = async (req, res, next) => {
    try {
        const { mes, anio } = req.query;
        
        // Convertimos a entero (si no se envían, usamos el mes actual)
        const mesInt = mes ? parseInt(mes) : new Date().getMonth() + 1;
        const anioInt = anio ? parseInt(anio) : new Date().getFullYear();

        const reporte = await reporteService.obtenerReporteMensual(req.user.negocioId, mesInt, anioInt);
        
        return successResponse(res, 200, `Reporte de Sueldos y Horas (${mesInt}/${anioInt})`, reporte);
    } catch (error) {
        next(error);
    }
};
