"use client"

import React, { useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUp, ArrowDown, Minus, Download } from "lucide-react"
import { DataTable } from "@/shared/ui/data-display/data-table"
import { formatCurrency } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/forms/button"

export interface ServiceReportData {
  id: string
  nombre: string
  categoria: string
  cantidad: number
  ingresos: number
  costos: number
  margen: number
  porcentajeVentas: number
  tendencia: "up" | "down" | "flat"
}

interface ServicesReportTableProps {
  data: ServiceReportData[]
  className?: string
}

export function ServicesReportTable({ data, className }: ServicesReportTableProps) {
  const columns = useMemo<ColumnDef<ServiceReportData>[]>(() => [
    {
      accessorKey: "nombre",
      header: "Servicio",
      cell: ({ row }) => <span className="font-bold text-gray-900 dark:text-neutral-100">{row.original.nombre}</span>,
    },
    {
      accessorKey: "categoria",
      header: "Categoría",
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-gray-500 dark:text-neutral-300 bg-gray-100 dark:bg-neutral-800 px-3 py-1 rounded-full whitespace-nowrap">
          {row.original.categoria}
        </span>
      ),
    },
    {
      accessorKey: "cantidad",
      header: "Volumen",
      cell: ({ row }) => (
        <span className="font-black text-gray-900 dark:text-neutral-100 text-lg">
          {row.original.cantidad}
        </span>
      ),
    },
    {
      accessorKey: "ingresos",
      header: "Ingresos",
      cell: ({ row }) => (
        <span className="font-bold text-gray-700 dark:text-neutral-300">
          {formatCurrency(row.original.ingresos)}
        </span>
      ),
    },
    {
      accessorKey: "costos",
      header: "Costos (Est.)",
      cell: ({ row }) => (
        <span className="font-bold text-gray-400 dark:text-neutral-500">
          {formatCurrency(row.original.costos)}
        </span>
      ),
    },
    {
      accessorKey: "margen",
      header: "Margen Bruto",
      cell: ({ row }) => (
        <span className="font-black text-green-600 dark:text-green-400">
          {formatCurrency(row.original.margen)}
        </span>
      ),
    },
    {
      accessorKey: "porcentajeVentas",
      header: "% Total",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900 dark:text-neutral-100 w-8 text-right">{row.original.porcentajeVentas}%</span>
          <div className="w-16 h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden shrink-0">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${row.original.porcentajeVentas}%` }} />
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tendencia",
      header: "Tendencia",
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.tendencia === "up" && <ArrowUp className="w-5 h-5 text-green-500 dark:text-green-400" strokeWidth={3} />}
          {row.original.tendencia === "down" && <ArrowDown className="w-5 h-5 text-red-500 dark:text-red-400" strokeWidth={3} />}
          {row.original.tendencia === "flat" && <Minus className="w-5 h-5 text-gray-300 dark:text-neutral-600" strokeWidth={3} />}
        </div>
      ),
    }
  ], []);

  const exportCsv = () => {
    // Basic CSV export logic
    const headers = ["Servicio,Categoría,Volumen,Ingresos,Costos,Margen,Porcentaje,Tendencia"];
    const rows = data.map(r => 
      `"${r.nombre}","${r.categoria}",${r.cantidad},${r.ingresos},${r.costos},${r.margen},${r.porcentajeVentas},${r.tendencia}`
    );
    const csv = headers.concat(rows).join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reporte_servicios.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-[2.5rem] p-4 sm:p-6 border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col ${className || ''}`}>
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-lg font-extrabold text-gray-900 dark:text-neutral-100 tracking-wider uppercase">
          Rendimiento Detallado
        </h3>
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        searchPlaceholder="Buscar servicio..."
        toolbarExtras={
          <Button onClick={exportCsv} variant="outline" size="sm" className="rounded-full h-9 gap-2 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-700">
            <Download className="w-4 h-4" /> Exportar CSV
          </Button>
        }
      />
    </div>
  )
}
