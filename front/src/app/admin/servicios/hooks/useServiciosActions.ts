import { useState, useCallback } from "react"
import { toast } from "sonner"
import { apiClient } from "@/shared/lib/api-client"

export function useServiciosActions({ fetchServicios, fetchStats }: { fetchServicios: () => void, fetchStats: () => void }) {
  const [isMutating, setIsMutating] = useState(false)
  
  const handleToggleDisponibilidad = useCallback(async (id: number, disponible: boolean) => {
    setIsMutating(true)
    try {
      await apiClient.patch(`/productos/${id}/disponibilidad`, { disponible })
      toast.success("Disponibilidad actualizada")
      fetchServicios()
      fetchStats()
    } catch (error: any) {
      console.error(error)
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsMutating(false)
    }
  }, [fetchServicios, fetchStats])

  const handleDelete = useCallback(async (id: number) => {
    setIsMutating(true)
    try {
      await apiClient.delete(`/productos/${id}`)
      toast.success("Servicio eliminado")
      fetchServicios()
      fetchStats()
    } catch (error: any) {
      console.error(error)
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsMutating(false)
    }
  }, [fetchServicios, fetchStats])

  return {
    isMutating,
    handleToggleDisponibilidad,
    handleDelete
  }
}

