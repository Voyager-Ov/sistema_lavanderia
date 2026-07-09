import { apiClient } from "@/shared/lib/api-client"

export interface DashboardStatsResponse {
  ingresos: {
    mesActual: number
    mesAnterior: number
    hoyCobrado: number
    ayerCobrado: number
    hoyTotalPedidos: number
  }
  pedidosDelDia: {
    hoy: number
    ayer: number
  }
  pedidosActivos: {
    PENDIENTE: number
    EN_PROCESO: number
    LISTO: number
    ENTREGADO: number
    PAGADO: number
    CANCELADO: number
  }
  topProductos: Array<{
    id: number
    nombre: string
    vendidos: number
  }>
  topClientes: Array<{
    id: number
    nombre: string
    pedidos: number
  }>
  ultimosPedidos: Array<{
    id: number
    title: string
    subtitle: string
    badgeText: string
    badgeColor: "green" | "yellow" | "red" | "blue"
  }>
  ventasPorDia: Array<{
    name: string
    ventas: number
  }>
}

export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  const response = await apiClient.get<{ data: DashboardStatsResponse }>('/dashboard/stats')
  return response.data
}
