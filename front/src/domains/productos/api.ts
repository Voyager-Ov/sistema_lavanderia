import { apiClient } from "@/shared/lib/api-client"

export interface Producto {
  id: number
  nombre: string
  precioActual: number | string
  costoEstimado?: number | string
  imagenUrl?: string
  disponible: boolean
  categoriaId: number
  tiempoEstimadoMinutos?: number
}

export interface ProductosResponse {
  ok: boolean
  data: {
    items: Producto[]
    meta?: any
  }
}

export const getProductos = async (): Promise<Producto[]> => {
  const response = await apiClient.get<ProductosResponse>(`/productos`)
  return response.data.items || []
}
