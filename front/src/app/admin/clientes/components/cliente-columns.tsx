"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Cliente } from "@/domains/clientes/api"
import { Button } from "@/shared/ui/forms/button"
import { Checkbox } from "@/shared/ui/forms/checkbox"
import { Eye, Edit, PowerOff, MessageCircle, MoreHorizontal } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/overlays/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/overlays/dropdown-menu"

export interface ClienteColumnsActions {
  onView: (cliente: Cliente) => void
  onEdit: (cliente: Cliente) => void
  onCobrarDeuda: (cliente: Cliente) => void
  onDesactivar: (cliente: Cliente) => void
}

const SALDO_STATUS = {
  deuda: { color: "text-red-700 bg-red-50 border-red-100", label: "Debe", prefix: "-$" },
  favor: { color: "text-emerald-700 bg-emerald-50 border-emerald-100", label: "A favor", prefix: "+$" },
  ok:    { color: "text-slate-500 bg-slate-50 border-slate-100", label: "Al día", prefix: "$" },
}

export const getClienteColumns = (actions: ClienteColumnsActions): ColumnDef<Cliente>[] => [
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
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nombre",
    header: "Cliente",
    cell: ({ row }) => {
      const nombre = row.original.nombre
      const inicial = nombre.charAt(0).toUpperCase()
      return (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center text-sm font-black shrink-0">
            {inicial}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-900 truncate">{nombre}</span>
            {!row.original.activo && (
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Inactivo</span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
    cell: ({ row }) => {
      const tel = row.original.telefono
      if (!tel) return <span className="text-gray-300 font-medium">—</span>
      return (
        <a
          href={`https://wa.me/${tel.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-gray-600 font-medium hover:text-green-600 transition-colors group"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          {tel}
        </a>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-gray-500 text-sm">{row.original.email || <span className="text-gray-300">—</span>}</span>
    ),
  },
  {
    accessorKey: "saldoCuentaCorriente",
    header: "Cuenta Corriente",
    cell: ({ row }) => {
      const saldo = parseFloat(row.original.saldoCuentaCorriente?.toString() || "0")
      const status = saldo > 0 ? SALDO_STATUS.deuda : saldo < 0 ? SALDO_STATUS.favor : SALDO_STATUS.ok
      const abs = Math.abs(saldo).toLocaleString("es-AR")
      return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${status.color}`}>
          <span className="text-[10px] font-black uppercase opacity-60">{status.label}</span>
          <span>{status.prefix}{abs}</span>
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const cliente = row.original
      return (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <TooltipProvider delayDuration={200}>
            {/* Desktop: botones individuales ghost con tooltips */}
            <div className="hidden xl:flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-transform hover:scale-110"
                    onClick={() => actions.onView(cliente)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-white text-blue-600 border-blue-200 font-semibold shadow-md">
                  Ver Detalle
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-transform hover:scale-110"
                    onClick={() => actions.onEdit(cliente)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-white text-indigo-600 border-indigo-200 font-semibold shadow-md">
                  Editar
                </TooltipContent>
              </Tooltip>

              {cliente.activo && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-transform hover:scale-110"
                      onClick={() => actions.onDesactivar(cliente)}
                    >
                      <PowerOff className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white text-red-600 border-red-200 font-semibold shadow-md">
                    Desactivar
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Mobile/tablet: menú 3 puntos */}
            <div className="xl:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => actions.onView(cliente)}>
                    <Eye className="mr-2 h-4 w-4 text-blue-600" />
                    Ver Detalle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => actions.onEdit(cliente)}>
                    <Edit className="mr-2 h-4 w-4 text-indigo-600" />
                    Editar
                  </DropdownMenuItem>
                  {cliente.activo && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => actions.onDesactivar(cliente)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <PowerOff className="mr-2 h-4 w-4" />
                        Desactivar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipProvider>
        </div>
      )
    },
  },
]
