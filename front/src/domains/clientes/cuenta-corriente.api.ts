import { apiClient } from "@/shared/lib/api-client"

export interface EstadoCuentaResumen {
  deudaExigible: number
  deudaNoExigible: number
  totalCreditoDisponible: number
  saldoNeto: number
  pedidosDeudaCount: number
  pedidosEnCursoCount: number
  creditosCount: number
}

export interface PedidoDeudaItem {
  id: number
  codigoSeguimiento: string
  total: number
  estado: string
  cobrado: boolean
  fechaRecepcion?: string
  fechaEntregaEstimada?: string
  createdAt: string
}

export interface CreditoDisponibleItem {
  id: number
  montoOriginal: number
  montoDisponible: number
  origen: "SOBREPAGO" | "CANCELACION_PEDIDO" | "AJUSTE_MANUAL"
  motivo?: string
  estado: "DISPONIBLE" | "CONSUMIDO_PARCIAL" | "CONSUMIDO_TOTAL" | "ANULADO"
  createdAt: string
  pedidoOrigen?: {
    id: number
    codigoSeguimiento: string
    total: number
  }
}

export interface EstadoCuentaData {
  cliente: {
    id: number
    nombre: string
    telefono?: string
    email?: string
  }
  resumen: EstadoCuentaResumen
  pedidosDeuda: PedidoDeudaItem[]
  pedidosEnCurso: PedidoDeudaItem[]
  creditosDisponibles: CreditoDisponibleItem[]
}

export interface MovimientoCuentaItem {
  id: string
  tipo: "CARGO" | "ABONO" | "CREDITO" | "CARGO_PEDIDO" | "PAGO_RECIBIDO" | "CREDITO_GENERADO"
  concepto?: string
  descripcion?: string
  monto: number
  montoEfectivo?: number
  montoCredito?: number
  montoDisponible?: number
  fecha: string
  pedidoId?: number
  pagoId?: number
  creditoId?: number
  referenciaId?: number
  codigoSeguimiento?: string
  metodoPago?: string
  impacto?: "DEBE" | "HABER"
  cobrado?: boolean
}

export interface MovimientosResponse {
  items: MovimientoCuentaItem[]
  meta: {
    total?: number
    totalItems?: number
    totalPages: number
    page?: number
    currentPage?: number
    limit?: number
  }
}

export interface CobrarDeudaParams {
  pedidosIds: number[]
  metodoPagoId?: number
  montoRecibido?: number
  aplicarSaldoAFavor?: boolean
  montoSaldoAFavor?: number
  dejarVueltoAFavor?: boolean
}

export interface CobroDeudaResultado {
  pedidosSaldadosCount: number
  pedidosIds: number[]
  totalLiquidado: number
  montoCreditoConsumido: number
  montoEfectivoTarjeta: number
  vueltoEntregado: number
  nuevoSaldoAFavorGenerado: number
}

export interface AjusteCreditoParams {
  monto: number
  motivo: string
}

export const obtenerEstadoCuenta = async (clienteId: number): Promise<EstadoCuentaData> => {
  const res = await apiClient.get<{ success: boolean; data: EstadoCuentaData }>(
    `/clientes/${clienteId}/cuenta-corriente/estado-cuenta`
  )
  return res.data
}

export const obtenerMovimientosCuenta = async (
  clienteId: number,
  params?: { page?: number; limit?: number; desde?: string; hasta?: string }
): Promise<MovimientosResponse> => {
  const query = new URLSearchParams()
  if (params?.page) query.append("page", params.page.toString())
  if (params?.limit) query.append("limit", params.limit.toString())
  if (params?.desde) query.append("desde", params.desde)
  if (params?.hasta) query.append("hasta", params.hasta)

  const qs = query.toString() ? `?${query.toString()}` : ""
  const res = await apiClient.get<{ success: boolean; data: MovimientosResponse }>(
    `/clientes/${clienteId}/cuenta-corriente/movimientos${qs}`
  )
  return res.data
}

export const obtenerCreditosDisponibles = async (clienteId: number): Promise<CreditoDisponibleItem[]> => {
  const res = await apiClient.get<{ success: boolean; data: CreditoDisponibleItem[] }>(
    `/clientes/${clienteId}/cuenta-corriente/creditos`
  )
  return res.data
}

export const cobrarDeuda = async (
  clienteId: number,
  params: CobrarDeudaParams
): Promise<CobroDeudaResultado> => {
  const res = await apiClient.post<{ success: boolean; data: CobroDeudaResultado }>(
    `/clientes/${clienteId}/cuenta-corriente/cobrar-deuda`,
    params
  )
  return res.data
}

export const ajusteManualCredito = async (
  clienteId: number,
  params: AjusteCreditoParams
): Promise<CreditoDisponibleItem> => {
  const res = await apiClient.post<{ success: boolean; data: CreditoDisponibleItem }>(
    `/clientes/${clienteId}/cuenta-corriente/ajuste-credito`,
    params
  )
  return res.data
}
