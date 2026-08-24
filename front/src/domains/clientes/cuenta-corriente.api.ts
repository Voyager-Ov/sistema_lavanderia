import { apiClient } from "@/shared/lib/api-client"

export interface EstadoCuentaResumen {
  deudaTotal?: number
  deudaExigible: number
  deudaNoExigible: number
  saldoAFavor: number
  totalCreditoDisponible?: number
  saldoNeto?: number
  pedidosDeudaCount?: number
  pedidosEnCursoCount?: number
  creditosCount?: number
}

export interface PedidoDeudaItem {
  id: number
  numeroPedido?: number
  codigoSeguimiento: string
  total: number
  estado: string | { nombre: string }
  esDeuda?: boolean
  fechaRecepcion?: string
  fechaEntregaEstimada?: string
  createdAt: string
  detalles?: any[]
  itemsCount?: number
}

export interface CreditoDisponibleItem {
  id: number
  montoDisponible: number
  montoOriginal?: number
  origen?: "SOBREPAGO" | "CANCELACION_PEDIDO" | "AJUSTE_MANUAL" | string
  motivo?: string
  estado?: "DISPONIBLE" | "CONSUMIDO_PARCIAL" | "CONSUMIDO_TOTAL" | "ANULADO" | string
  createdAt?: string
  pedidoOrigen?: {
    id?: number
    codigoSeguimiento: string
    total?: number
  }
}

export interface EstadoCuentaData {
  cliente?: {
    id: number
    nombre: string
    telefono?: string
    email?: string
  }
  resumen: EstadoCuentaResumen
  pedidosDeuda: PedidoDeudaItem[]
  pedidosEnCurso?: PedidoDeudaItem[]
  creditosDisponibles: CreditoDisponibleItem[]
  movimientos: MovimientoCuentaItem[]
}

export interface MovimientoCuentaItem {
  id?: number | string
  fecha?: string
  fechaHora?: string
  monto: number
  tipo?: "CARGO" | "ABONO" | "CREDITO" | "CARGO_PEDIDO" | "PAGO_RECIBIDO" | "CREDITO_GENERADO" | string
  tipoMovimiento?: string
  concepto?: string
  descripcion?: string
  montoEfectivo?: number
  montoCredito?: number
  montoDisponible?: number
  pedidoId?: number
  pagoId?: number
  creditoId?: number
  referenciaId?: number
  codigoSeguimiento?: string
  metodoPago?: string
  impacto?: "DEBE" | "HABER" | string
  cobrado?: boolean
}

export interface MovimientosResponse {
  clienteId?: number
  movimientos?: MovimientoCuentaItem[]
  items?: MovimientoCuentaItem[]
  meta?: {
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
  clienteId?: number
  pedidosCobradosCount: number
  totalMontoCobrado: number
  creditoConsumidoTotal: number
  saldoRestanteDeuda: number
  cobros?: any[]
  pedidosSaldadosCount?: number
  totalLiquidado?: number
}

export interface AjusteCreditoParams {
  monto: number
  concepto: string
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
): Promise<EstadoCuentaData> => {
  const res = await apiClient.post<{ success: boolean; data: EstadoCuentaData }>(
    `/clientes/${clienteId}/cuenta-corriente/ajuste-credito`,
    {
      monto: params.monto,
      concepto: params.concepto
    }
  )
  return res.data
}
