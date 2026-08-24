import { useState, useCallback } from "react"
import { toast } from "sonner"
import { apiClient } from "@/shared/lib/api-client"
import { eliminarProducto } from "@/domains/productos/api"

export function useServiciosActions({ fetchServicios, fetchStats }: { fetchServicios: () => void, fetchStats: () => void }) {
  const [isMutating, setIsMutating] = useState<boolean>(false)
  
  const handleToggleDisponibilidad = useCallback(async (id: number, disponible: boolean) => {
    setIsMutating(true)
    try {
      await apiClient.patch(`/servicios/${id}/disponibilidad`, { disponible })
      toast.success("Disponibilidad actualizada")
      fetchServicios()
      fetchStats()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al actualizar disponibilidad"
      console.error("Error handleToggleDisponibilidad:", error)
      toast.error(`Error: ${msg}`)
    } finally {
      setIsMutating(false)
    }
  }, [fetchServicios, fetchStats])

  const handleDelete = useCallback(async (id: number) => {
    setIsMutating(true)
    try {
      await eliminarProducto(id)
      toast.success("Servicio eliminado")
      fetchServicios()
      fetchStats()
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al eliminar servicio"
      console.error("Error handleDelete:", error)
      toast.error(`Error: ${msg}`)
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
