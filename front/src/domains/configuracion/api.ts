import { apiClient } from "@/shared/lib/api-client"

export interface ConfiguracionResponse {
  id: number
  razonSocial: string | null
  cuit: string | null
  direccion: string | null
  telefonoContacto: string | null
  colorPrincipal: string
  colorSecundario: string
  logoUrl: string | null
  simboloMoneda: string
  zonaHoraria: string
  mensajeTicket: string | null
  imprimirTicketAutomatico: boolean
  mostrarQrTicket: boolean
  anchoPapel: string
  facturacionHabilitada: boolean
  afipActivo: boolean
  afipModoFacturacion: string
  afipPuntoVenta: number | null
  certificadoAfipPath: string | null
  llaveAfipPath: string | null
  whatsappActivo: boolean
  whatsappEstadoConexion: string
  whatsappMensajeListo: string | null
  whatsappMensajeManual: string | null
  tokenMercadoPago: string | null
  mercadopagoPublicKey: string | null
  mpModoCobro: string
  aliasMp: string | null
}

export const obtenerConfiguracion = async (): Promise<ConfiguracionResponse> => {
  const res = await apiClient.get<{ success: boolean; data: ConfiguracionResponse }>("/configuracion")
  return res.data
}

export const actualizarConfiguracion = async (data: Partial<ConfiguracionResponse>): Promise<ConfiguracionResponse> => {
  const res = await apiClient.patch<{ success: boolean; data: ConfiguracionResponse }>("/configuracion", data)
  return res.data
}

export const subirCertificadosAfip = async (certificado: File | null, llavePrivada: File | null): Promise<ConfiguracionResponse> => {
  const formData = new FormData()
  if (certificado) formData.append("certificado", certificado)
  if (llavePrivada) formData.append("llavePrivada", llavePrivada)

  const res = await apiClient.postForm<{ success: boolean; data: ConfiguracionResponse }>("/configuracion/afip/certificados", formData)
  return res.data
}

