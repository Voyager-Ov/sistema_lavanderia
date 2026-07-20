"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Pedido } from "@/domains/pedidos/api"
import { Checkbox } from "@/shared/ui/forms/checkbox"
import { Button } from "@/shared/ui/forms/button"
import { useConfigStore } from "../../configuraciones/_store/useConfigStore"
import { Eye, MessageCircle, Pencil, XCircle, Printer, FileText, MoreHorizontal, Banknote, CheckCircle2, AlertTriangle, ArrowUpDown } from "lucide-react"
import { format, isBefore, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { StatusDropdown, StatusOption } from "@/shared/ui/data-display/status-dropdown"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/overlays/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/overlays/dropdown-menu"

const ESTADOS: StatusOption[] = [
  { value: "PENDIENTE", label: "Pendiente", colorClass: "bg-blue-100 text-blue-800" },
  { value: "EN_PROCESO", label: "En Proceso", colorClass: "bg-orange-100 text-orange-800" },
  { value: "LISTO_PARA_RETIRAR", label: "Listo", colorClass: "bg-green-100 text-green-800" },
  { value: "ENTREGADO", label: "Entregado", colorClass: "bg-gray-100 text-gray-800" },
  { value: "CANCELADO", label: "Cancelado", colorClass: "bg-red-100 text-red-800" },
]

export interface PedidoColumnsActions {
  onView: (pedido: Pedido) => void
  onCancel: (pedido: Pedido) => void
  onChangeStatus: (pedidoId: number, nuevoEstado: string) => void
  onPrintTicket: (pedido: Pedido) => void
  onGenerateFactura: (pedido: Pedido) => void
  onCobrar: (pedido: Pedido) => void
}

export const getPedidoColumns = (actions: PedidoColumnsActions): ColumnDef<Pedido>[] => [
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
      <div className="font-bold text-gray-900">{row.original.codigoSeguimiento}</div>
    ),
  },
  {
    accessorKey: "cliente",
    header: "Cliente",
    cell: ({ row }) => {
      const cliente = row.original.cliente
      return (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900">{cliente?.nombre || "Consumidor Final"}</span>
          {cliente?.telefono && (
            <span className="text-xs text-gray-500">{cliente.telefono}</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Fecha",
    cell: ({ row }) => (
      <div className="text-gray-600 font-medium">
        {format(new Date(row.original.createdAt), "dd MMM HH:mm", { locale: es })}
      </div>
    ),
  },
  {
    accessorKey: "items",
    header: "Detalle",
    enableSorting: false,
    cell: ({ row }) => {
      const items = row.original.items || []
      return (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {items.map((item, index) => (
            <span 
              key={index} 
              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200"
            >
              <span className="font-bold mr-1">{item.cantidad}x</span>
              {item.producto?.nombre}
            </span>
          ))}
          {items.length === 0 && <span className="text-gray-400 text-xs italic">-</span>}
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
      const metodo = pedido.pago?.metodoPago?.nombre || "N/A"
      
      return (
        <div className="flex flex-col gap-1">
          {cobrado ? (
            <>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded w-fit">
                <CheckCircle2 className="w-3 h-3" /> COBRADO
              </span>
              <span className="text-[10px] font-medium text-gray-500 uppercase">{metodo}</span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded w-fit">
              <XCircle className="w-3 h-3" /> IMPAGO
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "fechaEntregaEstimada",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-gray-100/50 -ml-4"
        >
          Entrega Est.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      if (!row.original.fechaEntregaEstimada) {
        return <span className="text-gray-400 text-xs italic">No def.</span>
      }

      const fechaEst = new Date(row.original.fechaEntregaEstimada)
      const hoy = new Date()
      let isUrgent = false
      let isOverdue = false

      if (row.original.estado === "PENDIENTE" || row.original.estado === "EN_PROCESO") {
        isOverdue = isBefore(fechaEst, hoy)
        isUrgent = !isOverdue && isBefore(fechaEst, addDays(hoy, 1))
      }

      return (
        <div className="flex flex-col gap-1">
          <span className="text-gray-900 font-medium whitespace-nowrap">
            {format(fechaEst, "dd MMM HH:mm", { locale: es })}
          </span>
          {isOverdue && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded w-fit">
              <AlertTriangle className="w-3 h-3" /> VENCIDO
            </span>
          )}
          {isUrgent && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded w-fit">
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
            onChange={(newStatus) => actions.onChangeStatus(row.original.id, newStatus)}
            disabled={row.original.estado === "ENTREGADO" || row.original.estado === "CANCELADO"}
          />
        </div>
        
        {row.original.cobrado ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Cobrado
          </span>
        ) : row.original.estado === "CANCELADO" ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200">
            Cancelado
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-xs font-bold rounded-full bg-white text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 shadow-sm transition-all hover:scale-105"
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
        const detalle = pedido.items?.map(i => i.producto?.nombre).join(', ') || "Servicios de lavandería"
        
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
                    className="h-8 w-8 text-gray-500 hover:text-brand-blue hover:bg-blue-50 rounded-full transition-transform hover:scale-110"
                    onClick={() => actions.onView(pedido)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-white text-brand-blue border-blue-200 font-semibold shadow-md">Ver Detalle</TooltipContent>
              </Tooltip>

              {telefono && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-transform hover:scale-110"
                      onClick={handleWhatsApp}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white text-green-600 border-green-200 font-semibold shadow-md">Enviar WhatsApp</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={
                      pedido.estado === "CANCELADO"
                        ? "h-8 w-8 text-gray-400 cursor-not-allowed rounded-full"
                        : "h-8 w-8 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-transform hover:scale-110"
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
                <TooltipContent className="bg-white text-indigo-600 border-indigo-200 font-semibold shadow-md">Imprimir Ticket</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={
                      pedido.estado === "CANCELADO"
                        ? "h-8 w-8 text-gray-400 cursor-not-allowed rounded-full"
                        : pedido.facturado
                          ? "h-8 w-8 text-teal-600 bg-teal-50 rounded-full cursor-default"
                          : (!pedido.cobrado 
                              ? "h-8 w-8 text-gray-400 cursor-not-allowed rounded-full" 
                              : "h-8 w-8 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-transform hover:scale-110"
                            )
                    }
                    onClick={() => {
                      if (!pedido.facturado && pedido.cobrado) {
                        actions.onGenerateFactura(pedido)
                      }
                    }}
                    disabled={pedido.facturado || !pedido.cobrado}
                  >
                    {pedido.facturado ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  className={
                    !pedido.cobrado && !pedido.facturado
                      ? "bg-white text-gray-400 border-gray-200 font-semibold shadow-md"
                      : "bg-white text-teal-600 border-teal-200 font-semibold shadow-md"
                  }
                >
                  {pedido.facturado ? "Facturado" : (!pedido.cobrado ? "Cobrar para facturar" : "Generar Factura AFIP")}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={
                      pedido.estado === "CANCELADO" || pedido.estado === "ENTREGADO"
                        ? "h-8 w-8 text-gray-400 cursor-not-allowed rounded-full"
                        : "h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-transform hover:scale-110"
                    }
                    onClick={() => actions.onCancel(pedido)}
                    disabled={pedido.estado === "CANCELADO" || pedido.estado === "ENTREGADO"}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  className={
                    pedido.estado === "CANCELADO" || pedido.estado === "ENTREGADO"
                      ? "bg-white text-gray-400 border-gray-200 font-semibold shadow-md"
                      : "bg-white text-red-600 border-red-200 font-semibold shadow-md"
                  }
                >
                  Cancelar Pedido
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Vista en pantallas pequeñas/medianas: menú de 3 puntos */}
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
                  <DropdownMenuItem 
                    onClick={() => actions.onGenerateFactura(pedido)}
                    disabled={pedido.estado === "CANCELADO"}
                  >
                    <FileText className="mr-2 h-4 w-4 text-green-600" />
                    Generar Factura
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => actions.onCancel(pedido)}
                    disabled={pedido.estado === "CANCELADO" || pedido.estado === "ENTREGADO"}
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
