import { apiClient } from "@/shared/lib/api-client"

export interface PedidoItem {
  productoId: number
  cantidad: number
}

export interface Cliente {
  id: number
  nombre: string
  telefono?: string
}

export interface Pedido {
  id: number
  clienteId: number
  estado: "PENDIENTE" | "EN_PROCESO" | "LISTO_PARA_RETIRAR" | "ENTREGADO" | "CANCELADO"
  codigoSeguimiento: string
  total: number
  createdAt: string
  cliente?: Cliente
}

export interface PedidosResponse {
  success: boolean
  data: {
    items: Pedido[]
    meta: {
      totalItems: number
      totalPages: number
      currentPage: number
      itemsPerPage: number
    }
  }
}

export const getPedidos = async (params?: { 
  estado?: string
  search?: string
  limit?: number
  page?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}): Promise<PedidosResponse> => {
  const query = new URLSearchParams()
  if (params?.estado) query.append('estado', params.estado)
  if (params?.search) query.append('search', params.search)
  if (params?.limit) query.append('limit', params.limit.toString())
  if (params?.page) query.append('page', params.page.toString())
  if (params?.sortBy) query.append('sortBy', params.sortBy)
  if (params?.sortOrder) query.append('sortOrder', params.sortOrder)
  
  const queryString = query.toString() ? `?${query.toString()}` : ''
  const response = await apiClient.get<PedidosResponse>(`/pedidos${queryString}`)
  return response
}

export const cambiarEstadoPedido = async (
  id: number, 
  estado: string, 
  comentario?: string
) => {
  return apiClient.patch<{ success: boolean; data: Pedido }>(`/pedidos/${id}/estado`, {
    estado,
    comentario
  })
}
