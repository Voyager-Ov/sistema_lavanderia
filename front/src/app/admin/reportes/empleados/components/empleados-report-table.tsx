import React, { useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/shared/ui/data-display/data-table"
import { formatCurrency } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/forms/button"
import { Download } from "lucide-react"

export interface EmpleadoReportRow {
  id: string
  nombre: string
  rol: string
  cajasAbiertas: number
  pedidosGenerados: number
  pedidosCancelados: number
  totalCobrado: number
}

interface EmpleadosReportTableProps {
  data: EmpleadoReportRow[]
  className?: string
}

export function EmpleadosReportTable({ data, className }: EmpleadosReportTableProps) {
  
  const getBadgeColor = (rol: string) => {
    switch (rol) {
      case 'ADMIN':
      case 'SUPERADMIN':
        return 'bg-purple-100 text-purple-700'
      case 'EMPLEADO':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const columns = useMemo<ColumnDef<EmpleadoReportRow>[]>(() => [
    {
      accessorKey: "nombre",
      header: "Empleado",
      cell: ({ row }) => <span className="font-bold text-gray-900 text-base">{row.original.nombre}</span>,
    },
    {
      accessorKey: "rol",
      header: "Rol",
      cell: ({ row }) => (
        <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${getBadgeColor(row.original.rol)}`}>
          {row.original.rol}
        </span>
      ),
    },
    {
      accessorKey: "cajasAbiertas",
      header: "Cajas",
      cell: ({ row }) => (
        <span className="font-bold text-gray-600">
          {row.original.cajasAbiertas} aperturas
        </span>
      ),
    },
    {
      accessorKey: "pedidosGenerados",
      header: "Pedidos Creados",
      cell: ({ row }) => (
        <span className="font-black text-blue-600 text-base">
          {row.original.pedidosGenerados}
        </span>
      ),
    },
    {
      accessorKey: "pedidosCancelados",
      header: "Cancelados",
      cell: ({ row }) => (
        <span className={`font-bold ${row.original.pedidosCancelados > 0 ? 'text-red-500' : 'text-gray-400'}`}>
          {row.original.pedidosCancelados}
        </span>
      ),
    },
    {
      accessorKey: "totalCobrado",
      header: "Recaudación Total",
      cell: ({ row }) => (
        <span className="font-black text-gray-900 text-lg">
          {formatCurrency(row.original.totalCobrado)}
        </span>
      ),
    }
  ], []);

  const exportCsv = () => {
    const headers = ["Empleado,Rol,Cajas Abiertas,Pedidos Generados,Cancelados,Total Cobrado"];
    const rows = data.map(r => 
      `"${r.nombre}","${r.rol}",${r.cajasAbiertas},${r.pedidosGenerados},${r.pedidosCancelados},${r.totalCobrado}`
    );
    const csv = headers.concat(rows).join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte_rendimiento_empleados.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-white rounded-[2.5rem] p-4 sm:p-6 border border-gray-100 shadow-sm flex flex-col h-full ${className || ''}`}>
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-lg font-extrabold text-gray-900 tracking-wider uppercase">
          Rendimiento por Empleado
        </h3>
      </div>

      <div className="flex-1">
        <DataTable 
          columns={columns} 
          data={data} 
          searchPlaceholder="Buscar empleado..."
          toolbarExtras={
            <Button onClick={exportCsv} variant="outline" size="sm" className="rounded-full h-9 gap-2">
              <Download className="w-4 h-4" /> Exportar CSV
            </Button>
          }
        />
      </div>
    </div>
  )
}
