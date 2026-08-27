import { apiClient } from "@/shared/lib/api-client";

export interface ApiResponse<T> {
  status?: string;
  success?: boolean;
  message?: string;
  data: T;
}

export interface ReportePedidosData {
  kpis: {
    ingresos: number;
    totalPedidos: number;
    ticket: number;
    cancelados: number;
    pendienteCobro: number;
    margenBruto: number;
    horasOperativas: number;
    tiempoMedioEntrega: number;
  };
  trend: Array<{ name: string; Ingresos: number; Pedidos: number }>;
  categoriesMetaData: Array<{ key: string; name: string; color: string }>;
  donut: Array<{ name: string; value: number; color: string }>;
  rendimientoEmpleados: Array<{ nombre: string; pedidos: number }>;
  empleadosMetadatos: any[];
  chartEmpleados: Array<{ nombre: string; pedidos: number }>;
  table: Array<{
    id: number;
    codigoSeguimiento: string;
    cliente: string;
    estado: string;
    total: number;
    fecha: string;
    fechaEntrega: string | null;
  }>;
}

export interface ReporteServiciosData {
  kpis: {
    ingresos: number;
    ticket: number;
    efectividad: number;
    cancelados: number;
    margenBruto: number;
    horasOperativas: number;
  };
  trend: Array<{ name: string; [key: string]: number | string }>;
  categoriesMetaData: Array<{ key: string; name: string; color: string }>;
  donut: Array<{ name: string; value: number; color: string }>;
  chartEmpleados: Array<{ nombre: string; servicios: number }>;
  servicesList: Array<{ id: number; label: string; value: number; displayValue: string }>;
  table: Array<{
    id: string;
    nombre: string;
    categoria: string;
    cantidad: number;
    ingresos: number;
    porcentajeVentas: number;
    tendencia: string;
  }>;
}

export interface ReporteVentasMetodoPagoData {
  totalRecaudado: number;
  items: Array<{
    nombre: string;
    icono: string;
    totalMonto: number;
    cantidadCobros: number;
  }>;
}

export interface ReporteGeneralFinanzasData {
  totalIngresos: number;
  totalPedidos: number;
  pedidosCobrados: number;
  pedidosPendientesPago: number;
}

export interface ReporteEmpleadosData {
  kpis: {
    totalCajas: number;
    tasaCancelacion: string;
    ingresosEfectivo: number;
  };
  trend: Array<{ name: string; ingresos: number }>;
  donut: Array<{ name: string; value: number; color: string }>;
  tablaEmpleados: Array<{
    id: string;
    nombre: string;
    rol: string;
    cajasAbiertas: number;
    pedidosGenerados: number;
    pedidosCancelados: number;
    totalCobrado: number;
  }>;
  ultimasCajas: Array<{
    id: string;
    fechaApertura: string;
    fechaCierre: string | null;
    estado: string;
    usuario: string;
    montoInicial: number;
    montoFinal: number;
    diferencia: number;
  }>;
}

export const reportesApi = {
  async obtenerReportePedidos(params?: { fechaInicio?: string; fechaFin?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.fechaInicio) queryParams.append("fechaInicio", params.fechaInicio);
    if (params?.fechaFin) queryParams.append("fechaFin", params.fechaFin);

    const url = `/reportes/pedidos${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const res = await apiClient.get<ApiResponse<ReportePedidosData>>(url);
    return res.data;
  },

  async obtenerReporteServicios(params?: { fechaInicio?: string; fechaFin?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.fechaInicio) queryParams.append("fechaInicio", params.fechaInicio);
    if (params?.fechaFin) queryParams.append("fechaFin", params.fechaFin);

    const url = `/reportes/servicios${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const res = await apiClient.get<ApiResponse<ReporteServiciosData>>(url);
    return res.data;
  },

  async obtenerReporteVentasMetodoPago(params?: { fechaInicio?: string; fechaFin?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.fechaInicio) queryParams.append("fechaInicio", params.fechaInicio);
    if (params?.fechaFin) queryParams.append("fechaFin", params.fechaFin);

    const url = `/reportes/ventas-metodo-pago${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const res = await apiClient.get<ApiResponse<ReporteVentasMetodoPagoData>>(url);
    return res.data;
  },

  async obtenerReporteFinanzas(params?: { fechaInicio?: string; fechaFin?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.fechaInicio) queryParams.append("fechaInicio", params.fechaInicio);
    if (params?.fechaFin) queryParams.append("fechaFin", params.fechaFin);

    const url = `/reportes/finanzas${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const res = await apiClient.get<ApiResponse<ReporteGeneralFinanzasData>>(url);
    return res.data;
  },

  async obtenerReporteEmpleados(params?: { fechaInicio?: string; fechaFin?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.fechaInicio) queryParams.append("fechaInicio", params.fechaInicio);
    if (params?.fechaFin) queryParams.append("fechaFin", params.fechaFin);

    const url = `/reportes/empleados${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const res = await apiClient.get<ApiResponse<ReporteEmpleadosData>>(url);
    return res.data;
  }
};
