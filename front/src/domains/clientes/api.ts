import { apiClient } from "@/shared/lib/api-client"

export interface Cliente {
  id: number
  nombre: string
  telefono?: string
  email?: string
  activo: boolean
  saldoCuentaCorriente: string | number
  createdAt: string
  updatedAt: string
  pedidos?: any[]
  movimientosCuentaCorriente?: any[]
}

export interface ClientesResponse {
  success: boolean
  data: {
    items: Cliente[]
    meta: {
      totalItems: number
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

export const crearCliente = async (data: { nombre: string; telefono: string; email?: string }) => {
  const response = await apiClient.post<{ success: boolean, data: Cliente }>(`/clientes`, data)
  return response.data
}

export const actualizarCliente = async (id: number, data: { nombre?: string; telefono?: string; email?: string }) => {
  const response = await apiClient.put<{ success: boolean, data: Cliente }>(`/clientes/${id}`, data)
  return response.data
}

export const desactivarCliente = async (id: number, motivoBaja: string) => {
  const response = await apiClient.patch<{ success: boolean, data: any }>(`/clientes/${id}/estado`, { motivoBaja })
  return response.data
}

export const registrarPagoCuentaCorriente = async (id: number, data: { monto: number; metodoPago: string; comentario?: string }) => {
  const response = await apiClient.post<{ success: boolean, data: any }>(`/clientes/${id}/cuenta-corriente/pagos`, data)
  return response.data
}

export const recalcularSaldoCuentaCorriente = async (id: number) => {
  const response = await apiClient.post<{ success: boolean, data: { saldoCorregido: number } }>(`/clientes/${id}/cuenta-corriente/recalcular`, {})
  return response.data
}

