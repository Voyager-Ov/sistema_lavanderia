"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/shared/ui/forms/checkbox"
import { Button } from "@/shared/ui/forms/button"
import { Badge } from "@/shared/ui/data-display/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/overlays/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/overlays/dropdown-menu"
import { Edit, History, Power, PowerOff, Clock, MoreHorizontal, Eye } from "lucide-react"
import { cn } from "@/shared/lib/utils"

// Paleta de colores para categorías (rotativa)
const CATEGORY_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800",
  "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
  "bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800",
  "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
  "bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-800",
]

// Función determinista para asignar color por categoría
function getCategoryColor(categoryId: number | string): string {
  const idx = typeof categoryId === "number" ? categoryId : parseInt(categoryId) || 0
  return CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
}

export interface ServicioColumnsActions {
  onView: (servicio: any) => void
  onEdit: (servicio: any) => void
  onHistory: (servicio: any) => void
  onToggleStatus: (id: number, disponible: boolean) => void
}

export function getServicioColumns(actions: ServicioColumnsActions): ColumnDef<any, any>[] {
  return [
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
      accessorKey: "nombre",
      header: "Servicio",
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-gray-900 dark:text-neutral-100">{s.nombre}</span>
            {s.descripcion && (
              <span className="text-xs text-gray-400 dark:text-neutral-400 truncate max-w-[180px]">{s.descripcion}</span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "categoria",
      header: "Categoría",
      cell: ({ row }) => {
        const cat = row.original.categoria
        if (!cat?.nombre) return <span className="text-xs text-gray-400 dark:text-neutral-500">—</span>
        const colorClass = getCategoryColor(cat.id)
        return (
          <span className={cn(
            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border",
            colorClass
          )}>
            {cat.nombre}
          </span>
        )
      },
    },
    {
      accessorKey: "precioActual",
      header: "Precio / Costo",
      cell: ({ row }) => {
        const p = Number(row.original.precioActual || 0)
        const c = Number(row.original.costoEstimado || 0)
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-black text-gray-900 dark:text-neutral-100 text-base">
              ${p.toLocaleString("es-AR")}
            </span>
            {c > 0 ? (
              <span className="text-[11px] font-bold text-gray-400 dark:text-neutral-400">
                Costo: ${c.toLocaleString("es-AR")}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-gray-300 dark:text-neutral-500">
                Sin costo est.
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "tiempoEstimadoMinutos",
      header: "Tiempo",
      cell: ({ row }) => {
        const mins = row.original.tiempoEstimadoMinutos
        if (!mins) return <span className="text-xs text-gray-400 dark:text-neutral-500">—</span>
        const h = Math.floor(mins / 60)
        const m = mins % 60
        const label = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-neutral-300">
            <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-neutral-400" />
            {label}
          </span>
        )
      },
    },
    {
      accessorKey: "disponible",
      header: "Estado",
      cell: ({ row }) => {
        const disp = row.original.disponible
        return (
          <Badge
            variant="outline"
            className={cn(
              "font-bold px-3 py-1 text-xs border-2",
              disp
                ? "border-green-500 text-green-700 dark:text-green-300 bg-white dark:bg-neutral-900"
                : "border-gray-300 dark:border-neutral-700 text-gray-500 dark:text-neutral-400 bg-white dark:bg-neutral-900"
            )}
          >
            {disp ? "Activo" : "Inactivo"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const item = row.original
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
                      className="h-8 w-8 text-gray-500 dark:text-neutral-400 hover:text-brand-blue dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-full transition-transform hover:scale-110"
                      onClick={() => actions.onView(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white dark:bg-neutral-900 text-brand-blue dark:text-blue-400 border-blue-200 dark:border-blue-800 font-semibold shadow-md">
                    Ver Detalle
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-full transition-transform hover:scale-110"
                      onClick={() => actions.onEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-semibold shadow-md">
                    Editar servicio
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-full transition-transform hover:scale-110"
                      onClick={() => actions.onHistory(item)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-semibold shadow-md">
                    Historial de precios
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 rounded-full transition-transform hover:scale-110",
                        item.disponible
                          ? "text-gray-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                          : "text-gray-500 dark:text-neutral-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40"
                      )}
                      onClick={() => actions.onToggleStatus(item.id, !item.disponible)}
                    >
                      {item.disponible
                        ? <PowerOff className="h-4 w-4" />
                        : <Power className="h-4 w-4" />
                      }
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className={cn(
                    "font-semibold shadow-md",
                    item.disponible
                      ? "bg-white dark:bg-neutral-900 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                      : "bg-white dark:bg-neutral-900 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                  )}>
                    {item.disponible ? "Pausar servicio" : "Activar servicio"}
                  </TooltipContent>
                </Tooltip>
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
                    <DropdownMenuItem onClick={() => actions.onView(item)}>
                      <Eye className="mr-2 h-4 w-4 text-brand-blue" />
                      Ver Detalle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => actions.onEdit(item)}>
                      <Edit className="mr-2 h-4 w-4 text-blue-600" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => actions.onHistory(item)}>
                      <History className="mr-2 h-4 w-4 text-indigo-600" />
                      Historial de precios
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => actions.onToggleStatus(item.id, !item.disponible)}>
                      {item.disponible
                        ? <PowerOff className="mr-2 h-4 w-4 text-red-500" />
                        : <Power className="mr-2 h-4 w-4 text-green-500" />
                      }
                      {item.disponible ? "Pausar servicio" : "Activar servicio"}
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
}
