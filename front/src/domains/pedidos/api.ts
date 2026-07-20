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

export interface PedidoItemDetail {
  productoId: number
  cantidad: number
  precioUnitario: number
  subtotal: number
  producto?: {
    id: number
    nombre: string
  }
}

export interface PedidoHistorial {
  id: number
  estadoAnterior: string | null
  estadoNuevo: string
  comentario: string | null
  createdAt: string
  usuario?: {
    id: number
    nombre: string
    rol: string
  }
}

export interface PedidoPago {
  id: number
  metodoPagoId: number
  metodoPago?: {
    id: number
    nombre: string
  }
  monto: number
  comprobanteUrl: string | null
  createdAt: string
}

export interface Pedido {
  id: number
  clienteId: number
  estado: "PENDIENTE" | "EN_PROCESO" | "LISTO_PARA_RETIRAR" | "ENTREGADO" | "CANCELADO"
  codigoSeguimiento: string
  total: number
  cobrado: boolean
  fechaRecepcion?: string
  fechaEntregaEstimada?: string
  fechaEntregadoReal?: string
  notas?: string
  facturado?: boolean
  facturaCae?: string
  facturaVtoCae?: string
  facturaNro?: string
  createdAt: string
  cliente?: Cliente
  items?: PedidoItemDetail[]
  historial?: PedidoHistorial[]
  pago?: PedidoPago
  motivoCancelacion?: string
  descripcionCancelacion?: string
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
  fechaInicio?: string
  fechaFin?: string
}): Promise<PedidosResponse> => {
  const query = new URLSearchParams()
  if (params?.estado) query.append('estado', params.estado)
  if (params?.search) query.append('search', params.search)
  if (params?.limit) query.append('limit', params.limit.toString())
  if (params?.page) query.append('page', params.page.toString())
  if (params?.sortBy) query.append('sortBy', params.sortBy)
  if (params?.sortOrder) query.append('sortOrder', params.sortOrder)
  if (params?.fechaInicio) query.append('fechaInicio', params.fechaInicio)
  if (params?.fechaFin) query.append('fechaFin', params.fechaFin)
  
  const queryString = query.toString() ? `?${query.toString()}` : ''
  const response = await apiClient.get<PedidosResponse>(`/pedidos${queryString}`)
  return response
}

export const getPedidoById = async (id: number): Promise<Pedido> => {
  const res = await apiClient.get<{ data: Pedido }>(`/pedidos/${id}`)
  return res.data
}

export const cambiarEstadoPedido = async (
  pedidoId: number,
  estado: string,
  comentario?: string,
  motivoCancelacion?: string,
  descripcionCancelacion?: string
) => {
  const res = await apiClient.patch<{ data: Pedido }>(`/pedidos/${pedidoId}/estado`, {
    estado,
    comentario,
    motivoCancelacion,
    descripcionCancelacion
  })
  return res.data
}

export const getTicketHTML = async (pedidoId: number) => {
  const res = await apiClient.get<string>(`/pedidos/${pedidoId}/ticket`, {
    responseType: 'text' as const
  } as any)
  return res
}

export const generarFactura = async (pedidoId: number) => {
  const res = await apiClient.post<{ data: { cae: string, nroComprobante: number } }>(`/pedidos/${pedidoId}/factura`, {})
  return res.data
}

export interface CrearPedidoPayload {
  clienteId: number
  fechaEntregaEstimada?: string // ISO string or Date string
  items: {
    productoId: number
    cantidad: number
  }[]
}

export const crearPedido = async (payload: CrearPedidoPayload): Promise<Pedido> => {
  const res = await apiClient.post<{ data: Pedido }>(`/pedidos`, payload)
  return res.data
}

export interface Ticket {
  id: number
  pedidoId: number
  codigo: string
  createdAt: string
}

export const generarTicketsAPI = async (pedidoId: number, cantidad: number): Promise<Ticket[]> => {
  const res = await apiClient.post<{ data: Ticket[] }>(`/pedidos/${pedidoId}/tickets`, { cantidad })
  return res.data
}

export const getTicketsPedidoAPI = async (pedidoId: number): Promise<Ticket[]> => {
  const res = await apiClient.get<{ data: Ticket[] }>(`/pedidos/${pedidoId}/tickets`)
  return res.data
}
export interface TrackingResponse {
  ticketCodigo: string
  pedidoId: number
  estado: string
  cobrado: boolean
  clienteNombre: string
  total: number
  fechaRecepcion: string
  fechaEntregaEstimada: string | null
  items: { nombre: string; cantidad: number }[]
}

export const getTrackingInfoAPI = async (negocioId: string, codigo: string): Promise<TrackingResponse> => {
  const res = await apiClient.get<{ data: TrackingResponse }>(`/tracking/${negocioId}/${codigo}`)
  return res.data
}
