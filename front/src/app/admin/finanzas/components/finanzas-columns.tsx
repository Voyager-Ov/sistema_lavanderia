import React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MovimientoFinanciero } from "@/domains/finanzas/finanzas.api"
import { Badge } from "@/shared/ui/data-display/badge"
import { User } from "lucide-react"

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
        <span className="text-gray-500 dark:text-neutral-400 font-medium whitespace-nowrap">
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
      <div className="font-bold text-gray-900 dark:text-neutral-100 truncate max-w-[200px]" title={row.getValue("descripcion")}>
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
        <span className="text-gray-500 dark:text-neutral-400 font-medium">
          {tipo === 'INGRESO' ? `#${ref}` : (ref as string)}
        </span>
      )
    },
  },
  {
    accessorKey: "metodoPago",
    header: "Método de Pago",
    cell: ({ row }) => {
      const metodo = (row.getValue("metodoPago") as string) || "Desconocido"
      const lower = metodo.toLowerCase()
      let badgeVariant: "success" | "secondary" | "warning" | "outline" = "outline"
      let customClasses = ""

      if (lower.includes("efectivo")) {
        badgeVariant = "success"
      } else if (lower.includes("mercadopago") || lower.includes("mp") || lower.includes("qr")) {
        customClasses = "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/40 font-bold"
      } else if (lower.includes("transferencia")) {
        customClasses = "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/40 font-bold"
      } else if (lower.includes("tarjeta")) {
        customClasses = "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/40 font-bold"
      } else if (lower.includes("saldo")) {
        badgeVariant = "warning"
      }

      return (
        <Badge variant={badgeVariant} className={`font-semibold text-xs px-2.5 py-0.5 rounded-md truncate max-w-[160px] ${customClasses}`}>
          {metodo}
        </Badge>
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
        <div className="font-black text-base whitespace-nowrap">
          <span className={tipo === 'INGRESO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
            {tipo === 'INGRESO' ? '+' : '-'} {formatted}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "registradoPor",
    header: "Registrado Por",
    cell: ({ row }) => {
      const usuario = (row.getValue("registradoPor") as string) || "Sistema"
      return (
        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-neutral-300">
          <User className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 shrink-0" />
          <span className="truncate max-w-[150px]" title={usuario}>{usuario}</span>
        </div>
      )
    },
  }
]

