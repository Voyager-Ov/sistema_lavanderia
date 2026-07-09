"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Pedido } from "@/domains/pedidos/api"
import { Checkbox } from "@/shared/ui/forms/checkbox"
import { Button } from "@/shared/ui/forms/button"
import { Eye, MessageCircle, Pencil, XCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { StatusDropdown, StatusOption } from "@/shared/ui/data-display/status-dropdown"

const ESTADOS: StatusOption[] = [
  { value: "PENDIENTE", label: "Pendiente", colorClass: "bg-blue-100 text-blue-800" },
  { value: "EN_PROCESO", label: "En Proceso", colorClass: "bg-orange-100 text-orange-800" },
  { value: "LISTO_PARA_RETIRAR", label: "Listo", colorClass: "bg-green-100 text-green-800" },
  { value: "ENTREGADO", label: "Entregado", colorClass: "bg-gray-100 text-gray-800" },
  { value: "CANCELADO", label: "Cancelado", colorClass: "bg-red-100 text-red-800" },
]

export interface PedidoColumnsActions {
  onView: (pedido: Pedido) => void
  onEdit: (pedido: Pedido) => void
  onCancel: (pedido: Pedido) => void
  onChangeStatus: (pedidoId: number, nuevoEstado: string) => void
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
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => (
      <div className="font-bold text-brand-blue">
        ${parseFloat(row.original.total.toString()).toLocaleString("es-AR")}
      </div>
    ),
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => (
      <StatusDropdown
        currentStatus={row.original.estado}
        options={ESTADOS}
        onChange={(newStatus) => actions.onChangeStatus(row.original.id, newStatus)}
        disabled={row.original.estado === "ENTREGADO" || row.original.estado === "CANCELADO"}
      />
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
        const mensaje = `Hola ${pedido.cliente?.nombre}, te escribimos para informarte que tu pedido ${pedido.codigoSeguimiento} se encuentra *${estadoText}*.`
        window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, "_blank")
      }

      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-brand-blue rounded-full"
            onClick={() => actions.onView(pedido)}
            title="Ver Detalle"
          >
            <Eye className="h-4 w-4" />
          </Button>

          {telefono && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full"
              onClick={handleWhatsApp}
              title="Enviar WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-orange-500 rounded-full"
            onClick={() => actions.onEdit(pedido)}
            title="Editar Pedido"
            disabled={pedido.estado === "CANCELADO" || pedido.estado === "ENTREGADO"}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-brand-red hover:bg-red-50 rounded-full"
            onClick={() => actions.onCancel(pedido)}
            title="Cancelar Pedido"
            disabled={pedido.estado === "CANCELADO" || pedido.estado === "ENTREGADO"}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]
