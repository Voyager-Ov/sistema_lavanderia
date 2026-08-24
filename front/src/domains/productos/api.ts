import { apiClient } from "@/shared/lib/api-client";

export interface CategoriaInfo {
  id: number;
  nombre: string;
  icono?: string | null;
  color?: string | null;
}

export interface Servicio {
  id: number;
  nombre: string;
  descripcion?: string | null;
  precioActual: number | string;
  costoEstimado?: number | string | null;
  imagenUrl?: string | null;
  disponible: boolean;
  activo: boolean;
  categoriaId: number | null;
  categoria?: CategoriaInfo | null;
  tiempoEstimadoMinutos?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

// Alias de compatibilidad semántica con vistas de mostrador
export type Producto = Servicio;

export interface HistorialPrecioItem {
  id: number;
  precio: number;
  precioNuevo: number;
  precioAnterior: number;
  fechaCambio: string;
  createdAt: string;
  fechaDesde?: string;
  fechaHasta?: string | null;
  motivo?: string | null;
}

export interface ServiciosResponse {
  success: boolean;
  message?: string;
  data: {
    items: Servicio[];
    meta?: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      itemsPerPage: number;
    };
  };
}

export type ProductosResponse = ServiciosResponse;

export interface ServicioStats {
  total: number;
  activos: number;
  categorias: number;
  masSolicitado: string | null;
}

export type ProductoStats = ServicioStats;

export interface BulkPrecioItem {
  id: number;
  precioActual: number;
}

export interface BulkPreciosPayload {
  servicios: BulkPrecioItem[];
}

export interface BulkDisponibilidadPayload {
  ids: number[];
  disponible: boolean;
}

export const getProductos = async (queryParams?: string): Promise<Servicio[]> => {
  const url = queryParams ? `/servicios?${queryParams}` : `/servicios`;
  const response = await apiClient.get<ServiciosResponse>(url);
  return response.data?.items ?? [];
};

export const getProductosPaginated = async (queryParams?: string): Promise<{ items: Servicio[]; meta?: any }> => {
  const url = queryParams ? `/servicios?${queryParams}` : `/servicios`;
  const response = await apiClient.get<ServiciosResponse>(url);
  return response.data ?? { items: [] };
};

export const getProductosStats = async (): Promise<ServicioStats> => {
  const response = await apiClient.get<{ success: boolean; data: ServicioStats }>(`/servicios/stats`);
  return response.data;
};

export const getProductoById = async (id: number | string): Promise<Servicio> => {
  const response = await apiClient.get<{ success: boolean; data: Servicio }>(`/servicios/${id}`);
  return response.data;
};

export const getHistorialPrecios = async (id: number | string): Promise<HistorialPrecioItem[]> => {
  const response = await apiClient.get<{ success: boolean; data: HistorialPrecioItem[] }>(`/servicios/${id}/historial`);
  return response.data ?? [];
};

export const actualizarPreciosMasivo = async (servicios: BulkPrecioItem[]): Promise<{ count: number; items: Servicio[] }> => {
  const response = await apiClient.put<{ success: boolean; data: { count: number; items: Servicio[] } }>(`/servicios/bulk/precios`, { servicios });
  return response.data;
};

export const actualizarDisponibilidadMasiva = async (ids: number[], disponible: boolean): Promise<{ count: number }> => {
  const response = await apiClient.patch<{ success: boolean; data: { count: number } }>(`/servicios/bulk/disponibilidad`, { ids, disponible });
  return response.data;
};

export const crearProducto = async (formData: FormData): Promise<Servicio> => {
  const response = await apiClient.postForm<{ success: boolean; data: Servicio }>(`/servicios`, formData);
  return response.data;
};

export const actualizarProducto = async (id: number | string, formData: FormData): Promise<Servicio> => {
  const response = await apiClient.putForm<{ success: boolean; data: Servicio }>(`/servicios/${id}`, formData);
  return response.data;
};

export const eliminarProducto = async (id: number | string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/servicios/${id}`);
  return response;
};
