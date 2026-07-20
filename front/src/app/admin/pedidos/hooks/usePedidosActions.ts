import { useState } from "react"
import { toast } from "sonner"
import { Pedido, cambiarEstadoPedido, generarFactura } from "@/domains/pedidos/api"

interface UsePedidosActionsProps {
  pedidos: Pedido[]
  setPedidos: React.Dispatch<React.SetStateAction<Pedido[]>>
  fetchStats: () => Promise<void>
  fetchOrders: () => Promise<void>
}

export function usePedidosActions({ pedidos, setPedidos, fetchStats, fetchOrders }: UsePedidosActionsProps) {
  const [loadingRowIds, setLoadingRowIds] = useState<string[]>([])
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})

  const handleStatusChange = async (pedidoId: number, nuevoEstado: string) => {
    const rowId = pedidoId.toString()
    setLoadingRowIds(prev => [...prev, rowId])
    setRowErrors(prev => {
      const { [rowId]: _, ...rest } = prev
      return rest
    })

    try {
      await cambiarEstadoPedido(pedidoId, nuevoEstado)
      // Update local state without full reload
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado as any } : p))
      
      fetchStats()
    } catch (error: any) {
      console.error("Error al cambiar estado:", error)
      setRowErrors(prev => ({ 
        ...prev, 
        [rowId]: error.response?.data?.message || "Error al cambiar el estado" 
      }))
    } finally {
      setLoadingRowIds(prev => prev.filter(id => id !== rowId))
    }
  }

  const handleConfirmCancel = async (pedidoId: number, motivo: string, descripcion: string) => {
    const comentario = `Cancelado: ${motivo}. ${descripcion}`.trim()
    await cambiarEstadoPedido(pedidoId, "CANCELADO", comentario)
    fetchOrders()
    fetchStats()
  }

  const processBulkStatusChange = async (selectedRows: Pedido[], nuevoEstado: string, actionName: string, clearSelection: () => void) => {
    const originalStates = selectedRows.map(p => ({ id: p.id, estado: p.estado }))
    
    // Optimistic UI Update
    setPedidos(prev => prev.map(p => {
      if (selectedRows.some(sr => sr.id === p.id)) {
        return { ...p, estado: nuevoEstado as any }
      }
      return p
    }))
    
    clearSelection()

    const promises = selectedRows.map(p => cambiarEstadoPedido(p.id, nuevoEstado, `Acción masiva: ${actionName}`))
    const results = await Promise.allSettled(promises)
    
    const failedIds: number[] = []
    const newErrors: Record<string, string> = {}
    
    results.forEach((res, index) => {
      if (res.status === "rejected") {
        const pId = selectedRows[index].id
        failedIds.push(pId)
        const errorMessage = res.reason?.message || res.reason?.toString() || "Error al actualizar estado"
        newErrors[pId.toString()] = errorMessage
      }
    })
    
    if (failedIds.length > 0) {
      setRowErrors(prev => ({ ...prev, ...newErrors }))
      
      setPedidos(prev => prev.map(p => {
        if (failedIds.includes(p.id)) {
          const original = originalStates.find(o => o.id === p.id)
          return original ? { ...p, estado: original.estado } : p
        }
        return p
      }))
      toast.error(`Hubo errores al procesar ${failedIds.length} pedidos. Revisa la tabla para ver el motivo exacto.`)
    } else {
      toast.success(`${selectedRows.length} pedidos pasaron a ${actionName}`, {
        action: {
          label: "Deshacer",
          onClick: () => {
            toast.promise(
              Promise.all(originalStates.map(o => cambiarEstadoPedido(o.id, o.estado, "Deshacer acción masiva"))),
              {
                loading: 'Deshaciendo cambios...',
                success: () => {
                  fetchOrders()
                  fetchStats()
                  return 'Cambios revertidos correctamente.'
                },
                error: 'Error al revertir los cambios.'
              }
            )
          }
        }
      })
    }
    
    fetchStats()
  }

  const handleGenerateFactura = async (pedido: Pedido) => {
    toast.promise(
      generarFactura(pedido.id),
      {
        loading: 'Generando factura AFIP...',
        success: (res: any) => `Factura creada. CAE: ${res.cae} - Nro: ${res.nroComprobante}`,
        error: (err: any) => err.response?.data?.message || 'Error al generar factura. Revisa la configuración AFIP.'
      }
    )
  }

  return {
    loadingRowIds,
    rowErrors,
    setRowErrors,
    handleStatusChange,
    handleConfirmCancel,
    processBulkStatusChange,
    handleGenerateFactura
  }
}
