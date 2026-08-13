import { apiClient } from "@/shared/lib/api-client";

export interface CategoriaInfo {
  id: number;
  nombre: string;
  icono?: string;
  color?: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precioActual: number | string;
  costoEstimado?: number | string;
  imagenUrl?: string;
  disponible: boolean;
  activo: boolean;
  categoriaId: number;
  categoria?: CategoriaInfo;
  tiempoEstimadoMinutos?: number;
}

export interface ProductosResponse {
  success: boolean;
  data: {
    items: Producto[];
    meta?: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      itemsPerPage: number;
    };
  };
}

export interface ProductoStats {
  total: number;
  activos: number;
  categorias: number;
  masSolicitado: string | null;
}

export const getProductos = async (queryParams?: string): Promise<Producto[]> => {
  const url = queryParams ? `/productos?${queryParams}` : `/productos`;
  const response = await apiClient.get<ProductosResponse>(url);
  return response.data?.items || [];
};

export const getProductosPaginated = async (queryParams?: string): Promise<{ items: Producto[]; meta?: any }> => {
  const url = queryParams ? `/productos?${queryParams}` : `/productos`;
  const response = await apiClient.get<ProductosResponse>(url);
  return response.data || { items: [] };
};

export const getProductosStats = async (): Promise<ProductoStats> => {
  const response = await apiClient.get<{ success: boolean; data: ProductoStats }>(`/productos/stats`);
  return response.data;
};

export const getProductoById = async (id: number | string): Promise<Producto> => {
  const response = await apiClient.get<{ success: boolean; data: Producto }>(`/productos/${id}`);
  return response.data;
};

export const crearProducto = async (formData: FormData): Promise<Producto> => {
  const response = await apiClient.postForm<{ success: boolean; data: Producto }>(`/productos`, formData);
  return response.data;
};

export const actualizarProducto = async (id: number | string, formData: FormData): Promise<Producto> => {
  const response = await apiClient.putForm<{ success: boolean; data: Producto }>(`/productos/${id}`, formData);
  return response.data;
};

export const eliminarProducto = async (id: number | string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/productos/${id}`);
  return response;
};
