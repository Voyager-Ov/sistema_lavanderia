"use client"

import React, { useState, useEffect, useCallback } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { getPedidos, cambiarEstadoPedido, Pedido } from "@/domains/pedidos/api"
import { Loader2, Clock, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { clsx } from "clsx"
import { Button } from "@/shared/ui/forms/button"
import { CobrarPedidosSheet } from "@/domains/pagos/components/cobrar-pedidos-sheet"
import { CancelPedidoSheet } from "./cancel-pedido-sheet"

import { useSocket } from "@/shared/hooks/useSocket"

const MAIN_COLUMNS = [
  { id: "PENDIENTE", title: "Pendientes", icon: Clock, color: "border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-900/50", headerColor: "text-blue-700 dark:text-blue-400" },
  { id: "EN_PROCESO", title: "En Proceso", icon: Loader2, color: "border-orange-200 bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-900/50", headerColor: "text-orange-700 dark:text-orange-400" },
  { id: "LISTO_PARA_RETIRAR", title: "Listos p/ Retirar", icon: CheckCircle2, color: "border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-900/50", headerColor: "text-green-700 dark:text-green-400" },
]

interface PosKanbanProps {
  isActive?: boolean
}

export function PosKanban({ isActive = true }: PosKanbanProps) {
  const { socket } = useSocket()

  const [pedidos, setPedidos] = useState<{ [key: string]: Pedido[] }>({
    "PENDIENTE": [],
    "EN_PROCESO": [],
    "LISTO_PARA_RETIRAR": [],
    "ENTREGADO": [],
    "CANCELADO": []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Cobrar State
  const [pedidoToCobrar, setPedidoToCobrar] = useState<Pedido | null>(null)
  const [isCobrarSheetOpen, setIsCobrarSheetOpen] = useState(false)

  // Cancelar State
  const [pedidoToCancel, setPedidoToCancel] = useState<Pedido | null>(null)
  const [isCancelSheetOpen, setIsCancelSheetOpen] = useState(false)

  const fetchBoard = useCallback(async (isManual = false) => {
    try {
      if (isManual) setIsRefreshing(true)
      else if (Object.values(pedidos).every(arr => arr.length === 0)) setIsLoading(true)

      // Fetch all orders sorted by createdAt DESC (newest first)
      const res = await getPedidos({ limit: 500, sortBy: 'createdAt', sortOrder: 'desc' })
      const allItems = res.data?.items || []

      const normalize = (val?: string) => (val || "").toString().trim().toUpperCase()

      const grouped: { [key: string]: Pedido[] } = {
        "PENDIENTE": [],
        "EN_PROCESO": [],
        "LISTO_PARA_RETIRAR": [],
        "ENTREGADO": [],
        "CANCELADO": []
      }

      for (const p of allItems) {
        const st = normalize(p.estado)
        if (st === "EN_PROCESO" || st === "EN_LAVADO" || st === "EN_SECADO" || st === "PROCESO") {
          grouped["EN_PROCESO"].push(p)
        } else if (st === "LISTO_PARA_RETIRAR" || st === "LISTO" || st === "COMPLETADO") {
          grouped["LISTO_PARA_RETIRAR"].push(p)
        } else if (st === "ENTREGADO") {
          grouped["ENTREGADO"].push(p)
        } else if (st === "CANCELADO" || st === "ANULADO") {
          grouped["CANCELADO"].push(p)
        } else {
          // Default all other orders (PENDIENTE, CREADO, etc.) to PENDIENTE
          grouped["PENDIENTE"].push(p)
        }
      }

      setPedidos(grouped)
    } catch (error) {
      console.error("Error al cargar tablero de producción:", error)
      toast.error("Error al cargar el tablero de producción")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Refetch when tab becomes active
  useEffect(() => {
    if (isActive) {
      fetchBoard()
    }
  }, [isActive, fetchBoard])

  // Real-time WebSocket event listener for order creation and updates
  useEffect(() => {
    if (!socket) return

    const handleUpdate = () => {
      fetchBoard()
    }

    socket.on("pedido:creado", handleUpdate)
    socket.on("pedido:estado_cambiado", handleUpdate)

    return () => {
      socket.off("pedido:creado", handleUpdate)
      socket.off("pedido:estado_cambiado", handleUpdate)
    }
  }, [socket, fetchBoard])

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result

    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
      return
    }

    const sourceCol = source.droppableId
    const destCol = destination.droppableId

    const sourceItems = [...(pedidos[sourceCol] || [])]
    const destItems = [...(pedidos[destCol] || [])]
    const [movedItem] = sourceItems.splice(source.index, 1)

    if (!movedItem) return

    movedItem.estado = destCol as any
    destItems.splice(destination.index, 0, movedItem)

    setPedidos({
      ...pedidos,
      [sourceCol]: sourceItems,
      [destCol]: destItems
    })

    if (destCol === "CANCELADO") {
      setPedidoToCancel(movedItem)
      setIsCancelSheetOpen(true)
      return
    }

    try {
      await cambiarEstadoPedido(movedItem.id, destCol)
      toast.success(`Pedido #${movedItem.id} movido a ${destCol.replace(/_/g, ' ')}`)
    } catch (error) {
      toast.error("Error al actualizar el estado del pedido")
      fetchBoard()
    }
  }

  const handleCancelSheetSuccess = () => {
    setIsCancelSheetOpen(false)
    setPedidoToCancel(null)
    fetchBoard()
  }

  const handleCancelSheetDismiss = () => {
    setIsCancelSheetOpen(false)
    setPedidoToCancel(null)
    fetchBoard()
  }

  const renderCard = (pedido: Pedido, index: number) => {
    const isVencido = pedido.fechaEntregaEstimada
      ? new Date(pedido.fechaEntregaEstimada) < new Date()
      : false

    return (
      <Draggable key={pedido.id.toString()} draggableId={pedido.id.toString()} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={provided.draggableProps.style as React.CSSProperties}
            className={clsx(
              "bg-white dark:bg-neutral-800 p-3 rounded-xl border border-gray-200 dark:border-neutral-700/80 shadow-sm flex flex-col gap-2 transition-all hover:shadow-md select-none",
              snapshot.isDragging && "shadow-lg scale-[1.02] border-brand-blue ring-2 ring-brand-blue/20"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight">
                  #{(pedido as any).codigoSeguimiento || (pedido as any).numeroPedido || pedido.id}
                </span>
                <span className="text-xs font-semibold text-gray-700 dark:text-neutral-300">
                  {pedido.cliente ? pedido.cliente.nombre : "Consumidor Final"}
                </span>

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
                    window.location.href = `/admin/pedidos`
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
                  {pedido.items.map(item => `${item.cantidad}x ${item.producto?.nombre || 'Item'}`).join(', ')}
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
    <div className="h-full flex-1 flex flex-col overflow-hidden">
      {/* Header bar with Refresh button */}
      <div className="flex items-center justify-between pb-2 px-1 flex-shrink-0">
        <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
          Tablero Kanban de Producción
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fetchBoard(true)}
          disabled={isRefreshing}
          className="h-8 text-xs font-bold rounded-xl flex items-center gap-1.5"
        >
          <RefreshCw className={clsx("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          <span>Actualizar</span>
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 flex-1 overflow-x-auto pb-4 snap-x min-h-0">
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
                    {pedidos[col.id]?.map((pedido, index) => renderCard(pedido, index))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}

          {/* Columna Doble: Entregados y Cancelados apilados */}
          <div className="min-w-[300px] w-[300px] flex-shrink-0 flex flex-col h-full snap-center gap-3">
            {/* Entregados */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-2 px-1 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
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
                      "flex-1 rounded-2xl border p-2 flex flex-col gap-2 overflow-y-auto transition-colors border-emerald-200 bg-emerald-50/30 dark:bg-emerald-900/10 dark:border-emerald-900/50",
                      snapshot.isDraggingOver && "bg-emerald-50 dark:bg-emerald-900/30 border-dashed"
                    )}
                  >
                    {pedidos["ENTREGADO"]?.map((pedido, index) => renderCard(pedido, index))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Cancelados */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-2 px-1 text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4 text-red-500" />
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
                    {pedidos["CANCELADO"]?.map((pedido, index) => renderCard(pedido, index))}
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
