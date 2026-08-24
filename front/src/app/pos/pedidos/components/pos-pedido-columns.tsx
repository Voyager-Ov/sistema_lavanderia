"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Pedido } from "@/domains/pedidos/api"
import { Checkbox } from "@/shared/ui/forms/checkbox"
import { Button } from "@/shared/ui/forms/button"
import { useConfigStore } from "@/app/admin/configuraciones/_store/useConfigStore"
import { Eye, MessageCircle, XCircle, Printer, MoreHorizontal, Banknote, CheckCircle2, AlertTriangle, ArrowUpDown } from "lucide-react"
import { format, isBefore, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { safeFormatDate } from "@/shared/lib/utils"
import { StatusDropdown, StatusOption } from "@/shared/ui/data-display/status-dropdown"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/overlays/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/overlays/dropdown-menu"

const ESTADOS: StatusOption[] = [
  { value: "PENDIENTE", label: "Pendiente", colorClass: "bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-400 transition-colors" },
  { value: "EN_PROCESO", label: "En Proceso", colorClass: "bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-400 transition-colors" },
  { value: "LISTO_PARA_RETIRAR", label: "Listo", colorClass: "bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400 transition-colors" },
  { value: "ENTREGADO", label: "Entregado", colorClass: "bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-neutral-300 transition-colors" },
  { value: "CANCELADO", label: "Cancelado", colorClass: "bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 transition-colors" },
]

export interface PosPedidoColumnsActions {
  onView: (pedido: Pedido) => void
  onCancel: (pedido: Pedido) => void
  onChangeStatus: (pedidoId: number, nuevoEstado: string) => void
  onPrintTicket: (pedido: Pedido) => void
  onCobrar: (pedido: Pedido) => void
}

export const getPosPedidoColumns = (actions: PosPedidoColumnsActions): ColumnDef<Pedido>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todo"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "codigoSeguimiento",
    header: "Ticket",
    cell: ({ row }) => (
      <div className="font-bold text-gray-900 dark:text-neutral-50 transition-colors">{row.original.codigoSeguimiento}</div>
    ),
  },
  {
    accessorKey: "cliente",
    header: "Cliente",
    cell: ({ row }) => {
      const cliente = row.original.cliente
      return (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 dark:text-neutral-50 transition-colors">{cliente?.nombre || "Consumidor Final"}</span>
          {cliente?.telefono && (
            <span className="text-xs text-gray-500 dark:text-neutral-400 transition-colors">{cliente.telefono}</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Fecha",
    cell: ({ row }) => (
      <div className="text-gray-600 dark:text-neutral-400 font-medium transition-colors">
        {safeFormatDate(row.original.createdAt, "dd MMM HH:mm")}
      </div>
    ),
  },
  {
    accessorKey: "items",
    header: "Detalle",
    enableSorting: false,
    cell: ({ row }) => {
      const items = row.original.detalles || row.original.items || []
      return (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {items.map((item: any, index: number) => (
            <span 
              key={index} 
              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 transition-colors"
            >
              <span className="font-bold mr-1">{item.cantidad}x</span>
              {item.servicio?.nombre || item.producto?.nombre || "Servicio"}
            </span>
          ))}
          {items.length === 0 && <span className="text-gray-400 dark:text-neutral-500 text-xs italic transition-colors">-</span>}
        </div>
      )
    },
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <div className="font-bold text-brand-blue">
        ${parseFloat(row.original.total.toString()).toLocaleString("es-AR")}
      </div>
    ),
  },
  {
    id: "pago",
    header: "Pago",
    cell: ({ row }) => {
      const pedido = row.original
      const cobrado = pedido.cobrado
      const metodo = pedido.cobros?.[0]?.metodoPago?.nombre || "N/A"
      
      return (
        <div className="flex flex-col gap-1">
          {cobrado ? (
            <>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-500/20 px-2 py-0.5 rounded w-fit transition-colors">
                <CheckCircle2 className="w-3 h-3" /> COBRADO
              </span>
              <span className="text-[10px] font-medium text-gray-500 dark:text-neutral-400 uppercase transition-colors">{metodo}</span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded w-fit transition-colors">
              <XCircle className="w-3 h-3" /> IMPAGO
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "fechaHoraEntregaEstimada",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-gray-100/50 dark:hover:bg-neutral-800/50 -ml-4 transition-colors"
        >
          Entrega Est.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      if (!row.original.fechaHoraEntregaEstimada) {
        return <span className="text-gray-400 dark:text-neutral-500 text-xs italic transition-colors">No def.</span>
      }

      const fechaEst = new Date(row.original.fechaHoraEntregaEstimada)
      const hoy = new Date()
      let isUrgent = false
      let isOverdue = false

      if (!isNaN(fechaEst.getTime()) && (row.original.estado === "PENDIENTE" || row.original.estado === "EN_PROCESO")) {
        isOverdue = isBefore(fechaEst, hoy)
        isUrgent = !isOverdue && isBefore(fechaEst, addDays(hoy, 1))
      }

      return (
        <div className="flex flex-col gap-1">
          <span className="text-gray-900 dark:text-neutral-50 font-medium whitespace-nowrap transition-colors">
            {safeFormatDate(row.original.fechaHoraEntregaEstimada, "dd MMM HH:mm", "No def.")}
          </span>
          {isOverdue && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-1.5 py-0.5 rounded w-fit transition-colors">
              <AlertTriangle className="w-3 h-3" /> VENCIDO
            </span>
          )}
          {isUrgent && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/20 px-1.5 py-0.5 rounded w-fit transition-colors">
              <AlertTriangle className="w-3 h-3" /> PRIORIDAD
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => (
      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="w-[165px] flex justify-end">
          <StatusDropdown
            currentStatus={row.original.estado}
            options={ESTADOS}
            onChange={(newStatus) => {
              if (newStatus === "CANCELADO") {
                actions.onCancel(row.original)
              } else {
                actions.onChangeStatus(row.original.id, newStatus)
              }
            }}
            disabled={row.original.estado === "CANCELADO"}
          />
        </div>
        
        {row.original.cobrado ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-500/30 transition-colors">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Cobrado
          </span>
        ) : row.original.estado === "CANCELADO" ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 border border-gray-200 dark:border-neutral-700 transition-colors">
            Cancelado
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs font-bold rounded-full bg-white dark:bg-transparent text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/50 hover:bg-green-50 dark:hover:bg-green-500/20 hover:text-green-800 dark:hover:text-green-300 shadow-sm transition-all hover:scale-105"
            onClick={() => actions.onCobrar(row.original)}
          >
            <Banknote className="h-3.5 w-3.5 mr-1.5" />
            Cobrar
          </Button>
        )}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const pedido = row.original
      const telefono = pedido.cliente?.telefono?.replace(/\D/g, "")

      const handleWhatsApp = () => {
        if (!telefono) return
        const estadoText = ESTADOS.find(e => e.value === pedido.estado)?.label?.toLowerCase() || "registrado"
        const detalle = pedido.detalles?.map(i => i.servicio?.nombre || i.producto?.nombre).filter(Boolean).join(', ') || "Servicios de lavandería"
        
        let template = useConfigStore.getState().notificationsConfig.whatsappMensajeManual 
          || "Hola {{nombre}}, te escribimos para informarte que tu pedido {{codigo}} se encuentra *{{estado}}*. Detalle: {{detalle}}";
        
        const mensaje = template
          .replace(/\{\{nombre\}\}/g, pedido.cliente?.nombre || 'Cliente')
          .replace(/\{\{codigo\}\}/g, pedido.codigoSeguimiento || '')
          .replace(/\{\{estado\}\}/g, estadoText)
          .replace(/\{\{detalle\}\}/g, detalle);

        window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, "_blank")
      }

      return (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <TooltipProvider delayDuration={200}>
            {/* Vista en pantallas grandes: botones individuales con Tooltips */}
            <div className="hidden xl:flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 dark:text-neutral-400 hover:text-brand-blue dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-transform hover:scale-110"
                    onClick={() => actions.onView(pedido)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-neutral-900 text-brand-blue dark:text-blue-400 border-blue-200 dark:border-blue-900 font-semibold shadow-md">Ver Detalle</TooltipContent>
              </Tooltip>

              {telefono && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 dark:text-neutral-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-full transition-transform hover:scale-110"
                      onClick={handleWhatsApp}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white dark:bg-neutral-900 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900 font-semibold shadow-md">Enviar WhatsApp</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={
                      pedido.estado === "CANCELADO"
                        ? "h-8 w-8 text-gray-400 dark:text-neutral-600 cursor-not-allowed rounded-full"
                        : "h-8 w-8 text-gray-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-full transition-transform hover:scale-110"
                    }
                    onClick={() => {
                      if (pedido.estado !== "CANCELADO") {
                        actions.onPrintTicket(pedido);
                      }
                    }}
                    disabled={pedido.estado === "CANCELADO"}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 font-semibold shadow-md">Imprimir Ticket</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={
                      pedido.estado === "CANCELADO"
                        ? "h-8 w-8 text-gray-400 dark:text-neutral-600 cursor-not-allowed rounded-full"
                        : "h-8 w-8 text-gray-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-transform hover:scale-110"
                    }
                    onClick={() => actions.onCancel(pedido)}
                    disabled={pedido.estado === "CANCELADO"}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  className={
                    pedido.estado === "CANCELADO"
                      ? "bg-white dark:bg-neutral-900 text-gray-400 dark:text-neutral-500 border-gray-200 dark:border-neutral-700 font-semibold shadow-md"
                      : "bg-white dark:bg-neutral-900 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 font-semibold shadow-md"
                  }
                >
                  Cancelar Pedido
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Vista en pantallas pequeÃ±as/medianas: menÃº de 3 puntos */}
            <div className="xl:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => actions.onView(pedido)}>
                    <Eye className="mr-2 h-4 w-4 text-brand-blue" />
                    Ver Detalle
                  </DropdownMenuItem>
                  {telefono && (
                    <DropdownMenuItem onClick={handleWhatsApp}>
                      <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
                      Enviar WhatsApp
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => actions.onPrintTicket(pedido)}
                    disabled={pedido.estado === "CANCELADO"}
                  >
                    <Printer className="mr-2 h-4 w-4 text-indigo-600" />
                    Imprimir Ticket
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => actions.onCancel(pedido)}
                    disabled={pedido.estado === "CANCELADO"}
                    className="text-brand-red focus:text-brand-red focus:bg-red-50"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar Pedido
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipProvider>
        </div>
      )
    },
  },
]
