import { apiClient } from "@/shared/lib/api-client"

export interface ConfiguracionResponse {
  id: number
  negocioId: number
  logoUrl: string | null
  colorPrincipal: string
  simboloMoneda: string
  zonaHoraria: string
  razonSocial: string | null
  cuit: string | null
  direccion: string | null
  telefonoContacto: string | null
  mensajeTicket: string | null
  imprimirTicketAutomatico: boolean
  mostrarQrTicket: boolean
  afipActivo: boolean
  afipModoFacturacion: "AUTOMATICO" | "MANUAL" | "DESACTIVADO"
  afipPuntoVenta: number | null
  afipCertificado?: string | null 
  whatsappActivo: boolean
  whatsappEstadoConexion: string
  whatsappMensajeListo: string
  whatsappMensajeManual: string | null
  mercadopagoAccessToken: string | null
  mpModoCobro: string
  mercadopagoPublicKey: string | null
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

  try {
    const res = await apiClient.post<{ success: boolean; data: ConfiguracionResponse }>("/configuracion/afip/certificados", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data
  } catch (error: any) {
    throw error
  }
}

