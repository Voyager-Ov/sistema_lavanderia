import { ColumnDef } from "@tanstack/react-table"
import { Cliente } from "@/domains/clientes/api"
import { Button } from "@/shared/ui/forms/button"
import { Checkbox } from "@/shared/ui/forms/checkbox"
import { Eye, Edit, PowerOff, MessageCircle, MoreHorizontal, Banknote, AlertCircle, CheckCircle2, Sparkles } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/overlays/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/overlays/dropdown-menu"

export interface ClienteColumnsActions {
  onView: (cliente: Cliente) => void
  onEdit: (cliente: Cliente) => void
  onCobrarDeuda?: (cliente: Cliente) => void
  onDesactivar: (cliente: Cliente) => void
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
      const nombreCompleto = `${row.original.nombre} ${row.original.apellido || ""}`.trim()
      const inicial = nombreCompleto.charAt(0).toUpperCase()
      const isActivo = row.original.activo !== false

      return (
        <div className="flex items-center gap-3 py-1">
          <div className="w-9 h-9 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center text-sm font-black shrink-0">
            {inicial}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-900 dark:text-neutral-100 truncate">{nombreCompleto}</span>
            {!isActivo && (
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
      if (!tel) return <span className="text-gray-300 dark:text-neutral-600 font-medium">—</span>
      const rawTel = tel.replace(/\D/g, "")
      const mensaje = encodeURIComponent(`Hola ${row.original.nombre}, te escribimos de la lavandería para consultar sobre tu cuenta.`)

      return (
        <a
          href={`https://wa.me/${rawTel}?text=${mensaje}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-gray-700 dark:text-neutral-300 font-medium hover:text-green-600 dark:hover:text-green-400 transition-colors group"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span>{tel}</span>
        </a>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-gray-500 dark:text-neutral-400 text-sm">{row.original.email || <span className="text-gray-300 dark:text-neutral-600">—</span>}</span>
    ),
  },
  {
    accessorKey: "saldoDeuda",
    header: "Saldo / Cuenta Corriente",
    cell: ({ row }) => {
      const deuda = row.original.saldoDeuda || 0
      const saldoAFavor = row.original.saldoAFavor || row.original.cuentaCorriente?.saldo || 0

      if (deuda > 0) {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 transition-colors">
            <AlertCircle className="w-3.5 h-3.5" />
            Debe ${deuda.toLocaleString("es-AR")}
          </span>
        )
      }

      if (saldoAFavor > 0) {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            A favor ${saldoAFavor.toLocaleString("es-AR")}
          </span>
        )
      }

      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30 transition-colors">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Al día ($0)
        </span>
      )
    },
  },
  {
    accessorKey: "activo",
    header: "Estado",
    cell: ({ row }) => {
      const isActivo = row.original.activo !== false
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${isActivo ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'}`}>
          {isActivo ? "Activo" : "Inactivo"}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const cliente = row.original
      const deuda = cliente.saldoDeuda || cliente.cuentaCorriente?.saldo || 0
      const isActivo = cliente.activo !== false

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
                    className="h-8 w-8 text-gray-500 dark:text-neutral-400 hover:text-brand-blue dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-transform hover:scale-110"
                    onClick={() => actions.onView(cliente)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-neutral-900 text-brand-blue dark:text-blue-400 border-blue-200 dark:border-blue-900 font-semibold shadow-md">
                  Ver Detalle y Pedidos
                </TooltipContent>
              </Tooltip>

              {deuda > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600 dark:text-green-400 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-500/20 rounded-full transition-transform hover:scale-110"
                      onClick={() => actions.onCobrarDeuda ? actions.onCobrarDeuda(cliente) : actions.onView(cliente)}
                    >
                      <Banknote className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white dark:bg-neutral-900 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900 font-semibold shadow-md">
                    Cobrar Pedidos Impagos (${deuda.toLocaleString("es-AR")})
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-full transition-transform hover:scale-110"
                    onClick={() => actions.onEdit(cliente)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900 font-semibold shadow-md">
                  Editar Cliente
                </TooltipContent>
              </Tooltip>

              {isActivo && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-transform hover:scale-110"
                      onClick={() => actions.onDesactivar(cliente)}
                    >
                      <PowerOff className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white dark:bg-neutral-900 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 font-semibold shadow-md">
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
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => actions.onView(cliente)}>
                    <Eye className="mr-2 h-4 w-4 text-brand-blue" />
                    Ver Detalle
                  </DropdownMenuItem>
                  {deuda > 0 && (
                    <DropdownMenuItem onClick={() => actions.onCobrarDeuda ? actions.onCobrarDeuda(cliente) : actions.onView(cliente)} className="text-green-600 font-bold">
                      <Banknote className="mr-2 h-4 w-4 text-green-600" />
                      Cobrar (${deuda.toLocaleString("es-AR")})
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => actions.onEdit(cliente)}>
                    <Edit className="mr-2 h-4 w-4 text-indigo-600" />
                    Editar
                  </DropdownMenuItem>
                  {isActivo && (
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
