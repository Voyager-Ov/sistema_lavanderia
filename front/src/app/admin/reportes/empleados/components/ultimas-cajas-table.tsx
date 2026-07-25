import React, { useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/shared/ui/data-display/data-table"
import { formatCurrency } from "@/shared/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/shared/ui/forms/button"
import { ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

export interface UltimaCajaRow {
  id: string
  fechaApertura: string
  fechaCierre: string | null
  estado: string
  usuario: string
  montoInicial: number
  montoFinal: number
  diferencia: number
}

interface UltimasCajasTableProps {
  data: UltimaCajaRow[]
  className?: string
}

export function UltimasCajasTable({ data, className }: UltimasCajasTableProps) {
  const router = useRouter()

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'CERRADA':
        return 'bg-green-100 text-green-700'
      case 'ABIERTA':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatFecha = (fechaStr: string) => {
    try {
      return format(new Date(fechaStr), "dd MMM yyyy, HH:mm", { locale: es })
    } catch (e) {
      return fechaStr
    }
  }

  const columns = useMemo<ColumnDef<UltimaCajaRow>[]>(() => [
    {
      accessorKey: "usuario",
      header: "Operador",
      cell: ({ row }) => <span className="font-bold text-gray-900">{row.original.usuario}</span>,
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => (
        <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${getBadgeColor(row.original.estado)}`}>
          {row.original.estado}
        </span>
      ),
    },
    {
      accessorKey: "montoFinal",
      header: "Arqueo Final",
      cell: ({ row }) => (
        <span className="font-black text-gray-900">
          {row.original.estado === 'CERRADA' ? formatCurrency(row.original.montoFinal) : '-'}
        </span>
      ),
    },
    {
      accessorKey: "diferencia",
      header: "Diferencia",
      cell: ({ row }) => {
        if (row.original.estado !== 'CERRADA') return <span className="text-gray-400 font-bold">-</span>;
        const diff = row.original.diferencia;
        const isPositive = diff > 0;
        const isNegative = diff < 0;
        return (
          <span className={`font-bold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-gray-500'}`}>
            {formatCurrency(diff)}
          </span>
        )
      },
    },
    {
      id: "fechas",
      accessorKey: "fechaApertura",
      header: "Horarios",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-700">Apertura: {formatFecha(row.original.fechaApertura)}</span>
          {row.original.fechaCierre && (
            <span className="text-xs font-medium text-gray-400 mt-0.5">Cierre: {formatFecha(row.original.fechaCierre)}</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-brand-blue hover:text-blue-700 hover:bg-blue-50 rounded-full font-bold px-4 gap-2"
            onClick={() => router.push('/admin/finanzas/cajas')}
          >
            Ver <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      )
    }
  ], [router]);

  return (
    <div className={`bg-white rounded-[2.5rem] p-4 sm:p-6 border border-gray-100 shadow-sm flex flex-col h-full ${className || ''}`}>
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-lg font-extrabold text-gray-900 tracking-wider uppercase">
          Últimas Cajas Registradas
        </h3>
      </div>

      <div className="flex-1">
        <DataTable 
          columns={columns} 
          data={data} 
          searchPlaceholder="Buscar caja..."
        />
      </div>
    </div>
  )
}
