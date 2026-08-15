"use client"

import React, { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { getPedidos, cambiarEstadoPedido, Pedido } from "@/domains/pedidos/api"
import { Loader2, Clock, AlertCircle, CheckCircle2, User, PackageCheck, XCircle } from "lucide-react"
import { toast } from "sonner"
import { format, isBefore, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { clsx } from "clsx"
import { Button } from "@/shared/ui/forms/button"
import { CobrarPedidosSheet } from "@/domains/pagos/components/cobrar-pedidos-sheet"
import { CancelPedidoSheet } from "./cancel-pedido-sheet"

const MAIN_COLUMNS = [
  { id: "PENDIENTE", title: "Pendientes", icon: Clock, color: "border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-900/50", headerColor: "text-blue-700 dark:text-blue-400" },
  { id: "EN_PROCESO", title: "En Proceso", icon: Loader2, color: "border-orange-200 bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-900/50", headerColor: "text-orange-700 dark:text-orange-400" },
  { id: "LISTO_PARA_RETIRAR", title: "Listos p/ Retirar", icon: CheckCircle2, color: "border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-900/50", headerColor: "text-green-700 dark:text-green-400" },
]

interface PosKanbanProps {
  isActive?: boolean
}

export function PosKanban({ isActive = true }: PosKanbanProps) {
  const [pedidos, setPedidos] = useState<{ [key: string]: Pedido[] }>({
    "PENDIENTE": [],
    "EN_PROCESO": [],
    "LISTO_PARA_RETIRAR": [],
    "ENTREGADO": [],
    "CANCELADO": []
  })
  const [isLoading, setIsLoading] = useState(true)
  
  // Cobrar State
  const [pedidoToCobrar, setPedidoToCobrar] = useState<Pedido | null>(null)
  const [isCobrarSheetOpen, setIsCobrarSheetOpen] = useState(false)

  // Cancelar State
  const [pedidoToCancel, setPedidoToCancel] = useState<Pedido | null>(null)
  const [isCancelSheetOpen, setIsCancelSheetOpen] = useState(false)

  const fetchBoard = async () => {
    try {
      setIsLoading(true)
      const res = await getPedidos({ limit: 100, sortBy: 'fechaEntregaEstimada', sortOrder: 'asc' })
      const allItems = res.data.items

      const grouped = {
        "PENDIENTE": allItems.filter(p => p.estado === "PENDIENTE"),
        "EN_PROCESO": allItems.filter(p => p.estado === "EN_PROCESO"),
        "LISTO_PARA_RETIRAR": allItems.filter(p => p.estado === "LISTO_PARA_RETIRAR"),
        "ENTREGADO": allItems.filter(p => p.estado === "ENTREGADO" && !p.cobrado),
        "CANCELADO": allItems.filter(p => p.estado === "CANCELADO" && isToday(new Date(p.createdAt)))
      }
      setPedidos(grouped)
    } catch (error) {
      toast.error("Error al cargar el tablero de producción")
    } finally {
      setIsLoading(false)
    }
  }

  // Reload when tab becomes active or on initial mount
  useEffect(() => {
    if (isActive) {
      fetchBoard()
    }
  }, [isActive])

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result
    
    // Dropped outside or no movement
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return
    }

    const sourceCol = source.droppableId
    const destCol = destination.droppableId
    
    // Optimistic UI update
    const sourceItems = [...pedidos[sourceCol]]
    const destItems = [...pedidos[destCol]]
    const [movedItem] = sourceItems.splice(source.index, 1)
    
    // Update state locally
    movedItem.estado = destCol as any
    destItems.splice(destination.index, 0, movedItem)

    setPedidos({
      ...pedidos,
      [sourceCol]: sourceItems,
      [destCol]: destItems
    })

    // If moved to Cancelado, intercept the API call and open sheet
    if (destCol === "CANCELADO") {
      setPedidoToCancel(movedItem)
      setIsCancelSheetOpen(true)
      return
    }

    // Persist API change for other columns
    try {
      await cambiarEstadoPedido(parseInt(draggableId), destCol)
      toast.success(`Pedido #${draggableId} movido a ${destCol.replace(/_/g, ' ')}`)
    } catch (error) {
      toast.error("Error al mover el pedido. Revertiendo...")
      fetchBoard() // Revert on failure
    }
  }

  const handleCancelSheetDismiss = () => {
    toast.info("Cancelación abortada")
    setPedidoToCancel(null)
    fetchBoard() // Revert the optimistic UI update
  }

  const handleCancelSheetSuccess = () => {
    setPedidoToCancel(null)
    fetchBoard() // Ensure board is perfectly synced
  }

  const renderCard = (pedido: Pedido, index: number) => {
    const isVencido = pedido.fechaEntregaEstimada && isBefore(new Date(pedido.fechaEntregaEstimada), new Date())
    
    return (
      <Draggable key={pedido.id} draggableId={pedido.id.toString()} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={clsx(
              "bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-2.5 shadow-sm flex flex-col gap-1.5 select-none transition-all",
              snapshot.isDragging && "shadow-xl ring-2 ring-brand-blue/50 rotate-2 scale-105"
            )}
            style={provided.draggableProps.style as React.CSSProperties}
          >
            {/* Header Card */}
            <div className="flex justify-between items-start gap-1">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1 font-bold text-gray-900 dark:text-gray-100 text-xs">
                  <span className="text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 rounded leading-none">
                    #{pedido.id}
                  </span>
                  <span className="truncate max-w-[130px] leading-tight">{pedido.cliente?.nombre || 'Consumidor Final'}</span>
                </div>
                
                {pedido.fechaEntregaEstimada && (
                  <p className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">
                    Ent: {format(new Date(pedido.fechaEntregaEstimada), "dd MMM HH:mm", { locale: es })}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                {isVencido && pedido.estado !== "CANCELADO" && pedido.estado !== "ENTREGADO" && (
                  <span className="flex items-center text-[9px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-1 py-0.5 rounded leading-none">
                    <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> URGENTE
                  </span>
                )}
                {pedido.estado === "CANCELADO" ? null : pedido.cobrado ? (
                  <span className="text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded leading-none">PAGADO</span>
                ) : (
                  <Button
                    onClick={() => {
                      setPedidoToCobrar(pedido)
                      setIsCobrarSheetOpen(true)
                    }}
                    size="sm"
                    className="h-5 text-[10px] px-2 rounded-lg font-bold shadow-sm z-10"
                  >
                    COBRAR
                  </Button>
                )}
                <Button
                  onClick={() => {
                    window.location.href = `/pos/pedidos/${pedido.id}`
                  }}
                  size="sm"
                  variant="outline"
                  className="h-5 text-[10px] px-2 rounded-lg font-bold shadow-sm z-10 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 bg-white dark:bg-neutral-800"
                >
                  VER
                </Button>
              </div>
            </div>
            
            {/* Content: Order Details Inline */}
            <div className="mt-0.5 pt-1 border-t border-gray-100 dark:border-neutral-800 text-[11px] text-gray-600 dark:text-neutral-400 leading-tight">
              {pedido.items && pedido.items.length > 0 ? (
                <p className="line-clamp-2">
                  {pedido.items.map(item => `${item.cantidad}x ${item.producto?.nombre}`).join(', ')}
                </p>
              ) : (
                <p className="italic">Sin detalles</p>
              )}
            </div>
          </div>
        )}
      </Draggable>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    )
  }

  return (
    <div className="h-full flex-1 overflow-hidden">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 h-full overflow-x-auto pb-4 snap-x">
          {/* Columnas Principales */}
          {MAIN_COLUMNS.map(col => (
            <div key={col.id} className="min-w-[300px] w-[300px] flex-shrink-0 flex flex-col h-full snap-center">
              <div className={clsx("flex items-center gap-2 mb-2 px-1", col.headerColor)}>
                <col.icon className="w-4 h-4" />
                <h3 className="font-bold text-sm">{col.title}</h3>
                <span className="ml-auto bg-white/50 dark:bg-black/20 text-xs px-2 py-0.5 rounded-full font-medium">
                  {pedidos[col.id]?.length || 0}
                </span>
              </div>
              
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={clsx(
                      "flex-1 rounded-2xl border p-2 flex flex-col gap-2 overflow-y-auto transition-colors",
                      col.color,
                      snapshot.isDraggingOver && "bg-gray-100 dark:bg-neutral-800/80 border-dashed"
                    )}
                  >
                    {pedidos[col.id].map((pedido, index) => renderCard(pedido, index))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}

          {/* Columna Doble: Entregados y Cancelados apilados */}
          <div className="min-w-[300px] w-[300px] flex-shrink-0 flex flex-col h-full snap-center gap-3">
            {/* Mitad Superior: Entregados */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-2 px-1 text-gray-500 dark:text-gray-400">
                <PackageCheck className="w-4 h-4" />
                <h3 className="font-bold text-sm">Entregados</h3>
                <span className="ml-auto bg-white/50 dark:bg-black/20 text-xs px-2 py-0.5 rounded-full font-medium">
                  {pedidos["ENTREGADO"]?.length || 0}
                </span>
              </div>
              <Droppable droppableId="ENTREGADO">
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={clsx(
                      "flex-1 rounded-2xl border p-2 flex flex-col gap-2 overflow-y-auto transition-colors border-gray-200 bg-gray-50/50 dark:bg-gray-900/10 dark:border-gray-800",
                      snapshot.isDraggingOver && "bg-gray-100 dark:bg-neutral-800/80 border-dashed"
                    )}
                  >
                    {pedidos["ENTREGADO"].map((pedido, index) => renderCard(pedido, index))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Mitad Inferior: Cancelados */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-2 px-1 text-red-500 dark:text-red-400">
                <XCircle className="w-4 h-4" />
                <h3 className="font-bold text-sm">Cancelados</h3>
                <span className="ml-auto bg-white/50 dark:bg-black/20 text-xs px-2 py-0.5 rounded-full font-medium">
                  {pedidos["CANCELADO"]?.length || 0}
                </span>
              </div>
              <Droppable droppableId="CANCELADO">
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={clsx(
                      "flex-1 rounded-2xl border p-2 flex flex-col gap-2 overflow-y-auto transition-colors border-red-200 bg-red-50/30 dark:bg-red-900/10 dark:border-red-900/50",
                      snapshot.isDraggingOver && "bg-red-50 dark:bg-red-900/30 border-dashed"
                    )}
                  >
                    {pedidos["CANCELADO"].map((pedido, index) => renderCard(pedido, index))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

        </div>
      </DragDropContext>

      <CobrarPedidosSheet
        open={isCobrarSheetOpen}
        onOpenChange={setIsCobrarSheetOpen}
        pedidos={pedidoToCobrar ? [pedidoToCobrar] : []}
        onSuccess={fetchBoard}
      />
      <CancelPedidoSheet
        open={isCancelSheetOpen}
        onOpenChange={setIsCancelSheetOpen}
        pedido={pedidoToCancel}
        onSuccess={handleCancelSheetSuccess}
        onDismiss={handleCancelSheetDismiss}
      />
    </div>
  )
}
