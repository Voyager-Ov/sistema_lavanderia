import React, { useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/shared/ui/data-display/data-table"
import { formatCurrency } from "@/shared/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/shared/ui/forms/button"
import { Download } from "lucide-react"

export interface PedidoReportRow {
  id: number
  codigoSeguimiento: string
  cliente: string
  estado: string
  total: number
  fecha: string
  fechaEntrega: string | null
}

interface PedidosReportTableProps {
  data: PedidoReportRow[]
  className?: string
}

export function PedidosReportTable({ data, className }: PedidosReportTableProps) {
  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'COMPLETADO':
      case 'ENTREGADO':
        return 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300'
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300'
      case 'CANCELADO':
        return 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
      case 'EN_PROCESO':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
      case 'LISTO_PARA_RETIRAR':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300'
    }
  }

  const formatFecha = (fechaStr: string) => {
    try {
      return format(new Date(fechaStr), "dd MMM yyyy, HH:mm", { locale: es })
    } catch (e) {
      return fechaStr
    }
  }

  const columns = useMemo<ColumnDef<PedidoReportRow>[]>(() => [
    {
      accessorKey: "codigoSeguimiento",
      header: "Cód.",
      cell: ({ row }) => (
        <span className="font-bold text-gray-500 dark:text-neutral-400 font-mono text-sm">
          {row.original.codigoSeguimiento}
        </span>
      ),
    },
    {
      accessorKey: "cliente",
      header: "Cliente",
      cell: ({ row }) => <span className="font-bold text-gray-900 dark:text-neutral-100">{row.original.cliente}</span>,
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => (
        <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${getBadgeColor(row.original.estado)}`}>
          {row.original.estado.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      accessorKey: "total",
      header: "Monto",
      cell: ({ row }) => (
        <span className="font-black text-gray-900 dark:text-neutral-100 text-base">
          {formatCurrency(row.original.total)}
        </span>
      ),
    },
    {
      id: "fechas",
      accessorKey: "fecha",
      header: "Fechas",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-700 dark:text-neutral-300">Recepción: {formatFecha(row.original.fecha)}</span>
          {row.original.fechaEntrega && (
            <span className="text-xs font-medium text-gray-400 dark:text-neutral-500 mt-0.5">Est. Entrega: {formatFecha(row.original.fechaEntrega)}</span>
          )}
        </div>
      ),
    }
  ], []);

  const exportCsv = () => {
    const headers = ["Codigo,Cliente,Estado,Total,Fecha Recepcion,Fecha Entrega Estimada"];
    const rows = data.map(r => 
      `"${r.codigoSeguimiento}","${r.cliente}","${r.estado}",${r.total},"${r.fecha}","${r.fechaEntrega || ''}"`
    );
    const csv = headers.concat(rows).join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte_pedidos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-[2.5rem] p-4 sm:p-6 border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col h-full ${className || ''}`}>
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-lg font-extrabold text-gray-900 dark:text-neutral-100 tracking-wider uppercase">
          Listado de Pedidos
        </h3>
      </div>

      <div className="flex-1">
        <DataTable 
          columns={columns} 
          data={data} 
          searchPlaceholder="Buscar por código o cliente..."
          toolbarExtras={
            <Button onClick={exportCsv} variant="outline" size="sm" className="rounded-full h-9 gap-2 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-700">
              <Download className="w-4 h-4" /> Exportar CSV
            </Button>
          }
        />
      </div>
    </div>
  )
}
