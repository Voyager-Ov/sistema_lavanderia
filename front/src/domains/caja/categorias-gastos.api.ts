import { apiClient } from "@/shared/lib/api-client";
import { ApiResponse } from "./caja.api";

export interface CategoriaGasto {
  id: number;
  negocioId: number;
  nombre: string;
  createdAt: string;
  updatedAt: string;
}

export async function obtenerCategoriasGastos(): Promise<CategoriaGasto[]> {
  const response = await apiClient.get<ApiResponse<CategoriaGasto[]>>('/categorias-gastos');
  return response.data;
}

export async function crearCategoriaGasto(nombre: string): Promise<CategoriaGasto> {
  const response = await apiClient.post<ApiResponse<CategoriaGasto>>('/categorias-gastos', { nombre });
  return response.data;
}

export async function eliminarCategoriaGasto(id: number): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`/categorias-gastos/${id}`);
}
