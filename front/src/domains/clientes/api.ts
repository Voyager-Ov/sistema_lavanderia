import { apiClient } from "@/shared/lib/api-client"

export interface Cliente {
  id: number
  nombre: string
  apellido?: string
  telefono?: string
  email?: string
  direccion?: string
  activo: boolean
  saldoDeuda?: number
  pedidosImpagosCount?: number
  cuentaCorriente?: {
    saldo: number
  }
  createdAt: string
  updatedAt: string
  pedidos?: any[]
}

export interface ClientesResponse {
  success: boolean
  data: {
    items: Cliente[]
    meta: {
      totalItems: number
      total: number
      totalPages: number
      currentPage: number
    }
  }
}

export const getClientes = async (queryParams?: Record<string, any>) => {
  const query = new URLSearchParams()
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, value.toString())
      }
    })
  }
  const queryString = query.toString() ? `?${query.toString()}` : ''
  const response = await apiClient.get<ClientesResponse>(`/clientes${queryString}`)
  return response
}

export const getClienteById = async (id: number) => {
  const response = await apiClient.get<{ success: boolean, data: Cliente }>(`/clientes/${id}`)
  return response.data
}

export const getPedidosImpagosCliente = async (clienteId: number) => {
  const response = await apiClient.get<{ success: boolean, data: { totalDeuda: number, pedidosImpagos: any[] } }>(`/clientes/${clienteId}/pedidos-impagos`)
  return response.data
}

export const cobrarPedidosCliente = async (clienteId: number, payload: { pedidosIds: number[]; metodoPagoId?: number; observaciones?: string }) => {
  const response = await apiClient.post<{ success: boolean, data: any }>(`/clientes/${clienteId}/cobrar-pedidos`, payload)
  return response.data
}

export const crearCliente = async (data: { nombre: string; apellido?: string; telefono?: string; email?: string; direccion?: string }) => {
  const response = await apiClient.post<{ success: boolean, data: Cliente }>(`/clientes`, data)
  return response.data
}

export const actualizarCliente = async (id: number, data: { nombre?: string; apellido?: string; telefono?: string; email?: string; direccion?: string }) => {
  const response = await apiClient.put<{ success: boolean, data: Cliente }>(`/clientes/${id}`, data)
  return response.data
}

export const desactivarCliente = async (id: number, motivoBaja?: string) => {
  const response = await apiClient.delete<{ success: boolean, data: any }>(`/clientes/${id}`)
  return response.data
}
