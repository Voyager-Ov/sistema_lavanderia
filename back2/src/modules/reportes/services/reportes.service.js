import { reportePedidosService } from "./reportePedidos.service.js";
import { reporteServiciosService } from "./reporteServicios.service.js";
import { reporteEmpleadosService } from "./reporteEmpleados.service.js";
import { reporteFinanzasService } from "./reporteFinanzas.service.js";

class ReportesService {
    async obtenerReportePedidos(negocioId, query = {}) {
        return await reportePedidosService.obtenerReportePedidos(negocioId, query);
    }

    async obtenerReporteServicios(negocioId, query = {}) {
        return await reporteServiciosService.obtenerReporteServicios(negocioId, query);
    }

    async obtenerReporteVentasPorMetodoPago(negocioId, query = {}) {
        return await reporteFinanzasService.obtenerReporteVentasPorMetodoPago(negocioId, query);
    }

    async obtenerReporteGeneralFinanzas(negocioId, query = {}) {
        return await reporteFinanzasService.obtenerReporteGeneralFinanzas(negocioId, query);
    }

    async obtenerReporteEmpleados(negocioId, query = {}) {
        return await reporteEmpleadosService.obtenerReporteEmpleados(negocioId, query);
    }
}

export const reportesService = new ReportesService();
