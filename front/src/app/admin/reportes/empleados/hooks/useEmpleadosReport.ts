import { useState, useCallback, useEffect } from "react"
import { apiClient } from "@/shared/lib/api-client"
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { toast } from "sonner"

export function useEmpleadosReport() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [fechaInicio, setFechaInicio] = useState<Date | undefined>(startOfMonth(new Date()))
  const [fechaFin, setFechaFin] = useState<Date | undefined>(endOfMonth(new Date()))

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      let url = "/reportes/empleados"
      const params = new URLSearchParams()
      
      if (fechaInicio) {
        params.append("fechaInicio", format(fechaInicio, "yyyy-MM-dd"))
      }
      
      if (fechaFin) {
        params.append("fechaFin", format(fechaFin, "yyyy-MM-dd"))
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await apiClient.get(url)
      
      // La API devuelve response.data directamente debido a nuestro interceptor en apiClient
      const resData = (response as any)?.data
      if (resData) {
        setData(resData)
      } else {
        throw new Error("Formato de respuesta inválido")
      }
    } catch (err: any) {
      console.error("Error fetching reportes de empleados:", err)
      setError(err.message || "Error al obtener datos")
      toast.error("Error al cargar reporte de empleados")
    } finally {
      setIsLoading(false)
    }
  }, [fechaInicio, fechaFin])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleQuickFilter = (type: "today" | "yesterday" | "thisWeek" | "thisMonth" | "lastMonth") => {
    const today = new Date()
    switch (type) {
      case "today":
        setFechaInicio(today)
        setFechaFin(today)
        break
      case "yesterday":
        setFechaInicio(subDays(today, 1))
        setFechaFin(subDays(today, 1))
        break
      case "thisWeek":
        setFechaInicio(startOfWeek(today, { weekStartsOn: 1 }))
        setFechaFin(endOfWeek(today, { weekStartsOn: 1 }))
        break
      case "thisMonth":
        setFechaInicio(startOfMonth(today))
        setFechaFin(endOfMonth(today))
        break
      case "lastMonth":
        const lastMonth = subMonths(today, 1)
        setFechaInicio(startOfMonth(lastMonth))
        setFechaFin(endOfMonth(lastMonth))
        break
    }
  }

  const handleClearFilters = () => {
    setFechaInicio(startOfMonth(new Date()))
    setFechaFin(endOfMonth(new Date()))
  }

  return {
    data,
    isLoading,
    error,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    handleQuickFilter,
    handleClearFilters
  }
}
