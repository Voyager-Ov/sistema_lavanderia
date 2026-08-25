import { useState, useEffect, useCallback } from "react"
import {
  obtenerEstadoCuenta,
  obtenerMovimientosCuenta,
  cobrarDeuda,
  ajusteManualCredito,
  EstadoCuentaData,
  MovimientoCuentaItem,
  CobrarDeudaParams,
  AjusteCreditoParams
} from "@/domains/clientes/cuenta-corriente.api"
import { toast } from "sonner"

export function useCuentaCorriente(clienteId: number) {
  const [estadoCuenta, setEstadoCuenta] = useState<EstadoCuentaData | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoCuentaItem[]>([])
  const [metaMovimientos, setMetaMovimientos] = useState({ totalItems: 0, totalPages: 1, currentPage: 1 })
  const [page, setPage] = useState(1)
  
  const [isLoadingEstado, setIsLoadingEstado] = useState(true)
  const [isLoadingMovimientos, setIsLoadingMovimientos] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchEstado = useCallback(async () => {
    if (!clienteId) return
    setIsLoadingEstado(true)
    try {
      const data = await obtenerEstadoCuenta(clienteId)
      setEstadoCuenta(data)
    } catch (error: any) {
      toast.error("Error al cargar la cuenta corriente")
      console.error(error)
    } finally {
      setIsLoadingEstado(false)
    }
  }, [clienteId])

  const fetchMovimientos = useCallback(async (targetPage = page) => {
    if (!clienteId) return
    setIsLoadingMovimientos(true)
    try {
      const data = await obtenerMovimientosCuenta(clienteId, { page: targetPage, limit: 10 })
      setMovimientos(data.movimientos ? data.movimientos : [])
      if (data.meta) {
        setMetaMovimientos({
          totalItems: data.meta.totalItems ?? 0,
          totalPages: data.meta.totalPages ?? 0,
          currentPage: data.meta.currentPage ?? 1
        })
      }
    } catch (error: any) {
      toast.error("Error al cargar el libro mayor de movimientos")
      console.error(error)
    } finally {
      setIsLoadingMovimientos(false)
    }
  }, [clienteId, page])

  useEffect(() => {
    fetchEstado()
  }, [fetchEstado])

  useEffect(() => {
    fetchMovimientos(page)
  }, [fetchMovimientos, page])

  const ejecutarCobroDeuda = async (params: CobrarDeudaParams) => {
    setIsSubmitting(true)
    try {
      const resultado = await cobrarDeuda(clienteId, params)
      toast.success("Cobro realizado con éxito")
      await Promise.all([fetchEstado(), fetchMovimientos(1)])
      setPage(1)
      return resultado
    } catch (error: any) {
      const msg = error?.message || "Error al realizar el cobro"
      toast.error(msg)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const ejecutarAjusteCredito = async (params: AjusteCreditoParams) => {
    setIsSubmitting(true)
    try {
      const res = await ajusteManualCredito(clienteId, params)
      toast.success(`Crédito a favor de $${params.monto.toLocaleString("es-AR")} acreditado exitosamente`)
      await Promise.all([fetchEstado(), fetchMovimientos(1)])
      setPage(1)
      return res
    } catch (error: any) {
      const msg = error?.message || "Error al ajustar el crédito"
      toast.error(msg)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    estadoCuenta,
    movimientos,
    metaMovimientos,
    page,
    setPage,
    isLoadingEstado,
    isLoadingMovimientos,
    isSubmitting,
    refreshEstado: fetchEstado,
    refreshMovimientos: () => fetchMovimientos(page),
    ejecutarCobroDeuda,
    ejecutarAjusteCredito
  }
}
