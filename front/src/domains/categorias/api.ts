import { apiClient } from "@/shared/lib/api-client";

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  color: string | null;
  activo: boolean;
}

export interface CategoriasResponse {
  success: boolean;
  message: string;
  data: {
    items: Categoria[];
  };
}

export const getCategorias = async (): Promise<Categoria[]> => {
  const response = await apiClient.get<CategoriasResponse>(`/categorias`);
  return response.data.items;
};

export const crearCategoria = async (data: { nombre: string; descripcion?: string | null; icono?: string | null; color?: string | null }): Promise<Categoria> => {
  const response = await apiClient.post<{ success: boolean; data: Categoria }>(`/categorias`, data);
  return response.data;
};

export const actualizarCategoria = async (id: number | string, data: { nombre?: string; descripcion?: string | null; icono?: string | null; color?: string | null }): Promise<Categoria> => {
  const response = await apiClient.put<{ success: boolean; data: Categoria }>(`/categorias/${id}`, data);
  return response.data;
};

export const eliminarCategoria = async (id: number | string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/categorias/${id}`);
  return response;
};
