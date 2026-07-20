import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MovimientoFinanciero } from "@/domains/finanzas/finanzas.api"
import { Badge } from "@/shared/ui/data-display/badge"

export const getFinanzasColumns = (): ColumnDef<MovimientoFinanciero>[] => [
  {
    accessorKey: "tipoMovimiento",
    header: "Tipo",
    cell: ({ row }) => {
      const tipo = row.getValue("tipoMovimiento") as string
      return (
        <Badge variant={tipo === 'INGRESO' ? 'success' : 'destructive'} className="rounded-full px-3">
          {tipo}
        </Badge>
      )
    },
  },
  {
    accessorKey: "fecha",
    header: "Fecha",
    cell: ({ row }) => {
      const dateStr = row.getValue("fecha") as string
      const date = new Date(dateStr)
      return (
        <span className="text-gray-500 font-medium">
          {new Intl.DateTimeFormat("es-AR", { 
            day: "2-digit", 
            month: "2-digit", 
            year: "numeric", 
            hour: "2-digit", 
            minute: "2-digit" 
          }).format(date)}
        </span>
      )
    },
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
    cell: ({ row }) => (
      <div className="font-bold text-gray-900 truncate max-w-[200px]" title={row.getValue("descripcion")}>
        {row.getValue("descripcion")}
      </div>
    ),
  },
  {
    accessorKey: "referenciaId",
    header: "Ref/Cat",
    cell: ({ row }) => {
      const tipo = row.original.tipoMovimiento
      const ref = row.getValue("referenciaId")
      return (
        <span className="text-gray-500">
          {tipo === 'INGRESO' ? `#${ref}` : (ref as string)}
        </span>
      )
    },
  },
  {
    accessorKey: "monto",
    header: "Monto",
    cell: ({ row }) => {
      const tipo = row.original.tipoMovimiento
      const monto = row.getValue("monto") as number
      const formatted = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto)
      return (
        <div className="font-black text-base">
          <span className={tipo === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'}>
            {tipo === 'INGRESO' ? '+' : '-'} {formatted}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "registradoPor",
    header: "Usuario",
    cell: ({ row }) => (
      <span className="text-gray-500">{row.getValue("registradoPor")}</span>
    ),
  }
]
