"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/shared/ui/data-display/badge"
import { Clock } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import { Servicio } from "@/domains/productos/api"

const CATEGORY_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-violet-50 text-violet-700 border-violet-100",
  "bg-amber-50 text-amber-700 border-amber-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-rose-50 text-rose-700 border-rose-100",
  "bg-cyan-50 text-cyan-700 border-cyan-100",
  "bg-orange-50 text-orange-700 border-orange-100",
  "bg-pink-50 text-pink-700 border-pink-100",
]

function getCategoryColor(categoryId: number | string): string {
  const idx = typeof categoryId === "number" ? categoryId : parseInt(categoryId) || 0
  return CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
}

export function getPosServicioColumns(): ColumnDef<Servicio>[] {
  return [
    {
      accessorKey: "nombre",
      header: "Servicio",
      cell: ({ row }) => {
        const s = row.original
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-gray-900">{s.nombre}</span>
            {s.descripcion && (
              <span className="text-xs text-gray-400 truncate max-w-[200px]">{s.descripcion}</span>
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
        if (!cat?.nombre) return <span className="text-xs text-gray-400">—</span>
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
      header: "Precio",
      cell: ({ row }) => (
        <span className="font-black text-brand-blue text-base">
          ${Number(row.original.precioActual).toLocaleString("es-AR")}
        </span>
      ),
    },
    {
      accessorKey: "tiempoEstimadoMinutos",
      header: "Tiempo Estimado",
      cell: ({ row }) => {
        const mins = row.original.tiempoEstimadoMinutos
        if (!mins || mins <= 0) return <span className="text-xs text-gray-400">—</span>
        const h = Math.floor(mins / 60)
        const m = mins % 60
        const label = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            {label}
          </span>
        )
      },
    },
    {
      accessorKey: "disponible",
      header: "Disponibilidad",
      cell: ({ row }) => {
        const disp = row.original.disponible
        return (
          <Badge
            variant="outline"
            className={cn(
              "font-bold px-3 py-1 text-xs border-2",
              disp
                ? "border-green-500 text-green-700 bg-green-50/50"
                : "border-gray-300 text-gray-500 bg-gray-50"
            )}
          >
            {disp ? "Disponible" : "No Disponible"}
          </Badge>
        )
      },
    },
  ]
}
