import { apiClient } from "@/shared/lib/api-client";

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  activo?: boolean;
}

export interface CategoriasResponse {
  success: boolean;
  data: {
    items: Categoria[];
    meta?: any;
  };
}

export const getCategorias = async (): Promise<Categoria[]> => {
  const response = await apiClient.get<CategoriasResponse>(`/categorias`);
  return response.data?.items || [];
};

export const crearCategoria = async (data: Partial<Categoria>): Promise<Categoria> => {
  const response = await apiClient.post<{ success: boolean; data: Categoria }>(`/categorias`, data);
  return response.data;
};

export const actualizarCategoria = async (id: number | string, data: Partial<Categoria>): Promise<Categoria> => {
  const response = await apiClient.put<{ success: boolean; data: Categoria }>(`/categorias/${id}`, data);
  return response.data;
};

export const eliminarCategoria = async (id: number | string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/categorias/${id}`);
  return response;
};
