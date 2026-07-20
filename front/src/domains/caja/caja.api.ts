import { apiClient } from "@/shared/lib/api-client";

export interface MetodoPagoInfo {
  id: number;
  nombre: string;
  esFijo: boolean;
}

export interface CajaPago {
  id: number;
  monto: number | string;
  metodoPagoId: number;
  pedidoId: number;
  cajaId: number;
  registradoPorId: number;
  estado: string;
  createdAt: string;
  metodoPago?: MetodoPagoInfo;
}

export interface CajaGasto {
  id: number;
  monto: number | string;
  categoria: string;
  descripcion: string;
  cajaId: number;
  registradoPorId: number;
  metodoPagoId?: number;
  createdAt: string;
  metodoPago?: MetodoPagoInfo;
}

export interface CajaActual {
  id: number;
  negocioId: number;
  usuarioId: number;
  estado: string;
  montoInicial: number | string;
  fechaApertura: string;
  fechaCierre: string | null;
  pagos: CajaPago[];
  gastos: CajaGasto[];
  totalIngresosEnVivo: number;
  totalEgresosEnVivo: number;
  totalIngresosEfectivo?: number;
  totalIngresosDigitales?: number;
  totalEgresosEfectivo?: number;
  totalEgresosDigitales?: number;
  efectivoEsperadoEnVivo: number;
  efectivoReal?: number | null;
  totalesPorMetodo?: {
    metodoPagoId: number;
    nombre: string;
    ingresos: number;
    egresos: number;
  }[];
  actividadTurno?: {
    id: number;
    pedidoId: number;
    estadoAnterior?: string;
    estadoNuevo: string;
    comentario?: string;
    createdAt: string;
  }[];
  usuario?: {
    id: number;
    nombre: string;
    email: string;
  };
}

export interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
}

export async function obtenerCajaActual(): Promise<CajaActual> {
  const response = await apiClient.get<ApiResponse<CajaActual>>('/cajas/actual');
  return response.data;
}

export async function abrirCaja(montoInicial: number): Promise<CajaActual> {
  const response = await apiClient.post<ApiResponse<CajaActual>>('/cajas/abrir', { montoInicial });
  return response.data;
}

export async function cerrarCaja(cajaId: number, efectivoReal: number): Promise<CajaActual> {
  const response = await apiClient.post<ApiResponse<CajaActual>>(`/cajas/${cajaId}/cerrar`, { efectivoReal });
  return response.data;
}

export interface RegistrarGastoInput {
  monto: number;
  categoria: string;
  descripcion: string;
  metodoPagoId?: number;
}

export async function registrarGasto(data: RegistrarGastoInput): Promise<CajaGasto> {
  const response = await apiClient.post<ApiResponse<CajaGasto>>('/gastos', data);
  return response.data;
}

export async function obtenerHistorialCajas(params?: { limit?: number; offset?: number }): Promise<{ total: number; items: CajaActual[] }> {
  const query = new URLSearchParams();
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.offset) query.append('offset', params.offset.toString());
  const response = await apiClient.get<ApiResponse<{ total: number; items: CajaActual[] }>>(`/cajas?${query.toString()}`);
  return response.data;
}

export async function obtenerCajaPorId(id: number): Promise<CajaActual> {
  const response = await apiClient.get<ApiResponse<CajaActual>>(`/cajas/${id}`);
  return response.data;
}
