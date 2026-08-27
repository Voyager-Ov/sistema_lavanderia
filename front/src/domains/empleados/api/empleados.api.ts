import { apiClient } from "@/shared/lib/api-client";

export interface EmpleadoDTO {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: "admin" | "empleado" | string;
  activo: boolean;
  sueldoBase: number;
  horasSemanalesObjetivo: number;
  usuarioIdCentral?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmpleadosMetaDTO {
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface EmpleadosListResponse {
  items: EmpleadoDTO[];
  meta: EmpleadosMetaDTO;
}

export interface CrearEmpleadoPayload {
  nombre: string;
  email: string;
  password?: string;
  rol?: "admin" | "empleado" | string;
  telefono?: string;
  sueldoBase?: number;
  horasSemanalesObjetivo?: number;
}

export interface ActualizarEmpleadoPayload {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: "admin" | "empleado" | string;
  telefono?: string;
  sueldoBase?: number;
  horasSemanalesObjetivo?: number;
}

export interface EmpleadoMetricasDTO {
  empleadoId: number;
  nombre: string;
  cajasAtendidas: number;
  pedidosProcesados: number;
  totalFacturado: number;
  ventasTotales: {
    monto: number;
    cantidad: number;
  };
  gastosRegistrados: {
    monto: number;
    cantidad: number;
  };
  cajasOperadas: Array<{
    idCaja: number;
    fechaApertura: string;
    fechaCierre: string | null;
    montoInicial: number;
    diferenciaEfectivo: number;
    estado: string;
    totalIngresos: number;
    totalEgresos: number;
  }>;
}

export interface ApiResponse<T> {
  status?: string;
  success?: boolean;
  message?: string;
  data: T;
}

export const empleadosApi = {
  async obtenerEmpleados(params?: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: "asc" | "desc" }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const url = `/rrhh/empleados${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const res = await apiClient.get<ApiResponse<EmpleadosListResponse>>(url);
    return res.data;
  },

  async obtenerEmpleadoPorId(id: number) {
    const res = await apiClient.get<ApiResponse<EmpleadoDTO>>(`/rrhh/empleados/${id}`);
    return res.data;
  },

  async crearEmpleado(payload: CrearEmpleadoPayload) {
    const res = await apiClient.post<ApiResponse<EmpleadoDTO>>("/rrhh/empleados", payload);
    return res.data;
  },

  async actualizarEmpleado(id: number, payload: ActualizarEmpleadoPayload) {
    const res = await apiClient.put<ApiResponse<EmpleadoDTO>>(`/rrhh/empleados/${id}`, payload);
    return res.data;
  },

  async cambiarEstadoEmpleado(id: number, activo: boolean) {
    const res = await apiClient.patch<ApiResponse<EmpleadoDTO>>(`/rrhh/empleados/${id}/estado`, { activo });
    return res.data;
  },

  async obtenerMetricasEmpleado(id: number) {
    const res = await apiClient.get<ApiResponse<EmpleadoMetricasDTO>>(`/rrhh/empleados/${id}/metricas`);
    return res.data;
  }
};
