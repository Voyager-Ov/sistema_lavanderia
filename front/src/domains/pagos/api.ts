import { apiClient } from "@/shared/lib/api-client"

export interface MetodoPago {
  id: number
  nombre: string
  activo: boolean
  icono?: string
  esFijo: boolean
}

export interface RegistrarPagoParams {
  pedidoId: number
  metodoPagoId?: number
  monto?: number
  montoRecibido?: number
  aplicarSaldoAFavor?: boolean
  montoSaldoAFavor?: number
  dejarVueltoAFavor?: boolean
  facturarAfip?: boolean
}

export interface PagoRespuesta {
  id: number
  pedidoId: number
  monto: number
  montoEfectivoTarjeta?: number
  montoCreditoAplicado?: number
  montoAFavorGenerado?: number
  vueltoEntregado?: number
  estado: string
}

export const obtenerMetodosPago = async (): Promise<MetodoPago[]> => {
  const res = await apiClient.get<{ success: boolean; data: MetodoPago[] }>("/pagos/metodos")
  return res.data
}

export const crearMetodoPago = async (nombre: string, icono: string): Promise<MetodoPago> => {
  const res = await apiClient.post<{ success: boolean; data: MetodoPago }>("/pagos/metodos", { nombre, icono })
  return res.data
}

export const toggleMetodoPago = async (id: number): Promise<MetodoPago> => {
  const res = await apiClient.patch<{ success: boolean; data: MetodoPago }>(`/pagos/metodos/${id}`, {})
  return res.data
}

export const eliminarMetodoPago = async (id: number): Promise<void> => {
  await apiClient.delete(`/pagos/metodos/${id}`)
}

export const registrarPago = async (params: RegistrarPagoParams): Promise<PagoRespuesta> => {
  const res = await apiClient.post<{ success: boolean; data: PagoRespuesta }>("/pagos", params)
  return res.data
}

export const obtenerSaldosAFavorCliente = async (clienteId: number): Promise<any[]> => {
  const res = await apiClient.get<{ success: boolean; data: any[] }>(`/pagos/saldos-a-favor/${clienteId}`)
  return res.data
}
