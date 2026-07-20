import { apiClient } from "@/shared/lib/api-client"

export interface Categoria {
  id: number
  nombre: string
}

export interface CategoriasResponse {
  ok: boolean
  data: {
    items: Categoria[]
    meta?: any
  }
}

export const getCategorias = async (): Promise<Categoria[]> => {
  const response = await apiClient.get<CategoriasResponse>(`/categorias`)
  return response.data.items || []
}
