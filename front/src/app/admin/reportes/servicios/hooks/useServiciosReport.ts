import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/shared/lib/api-client';

export interface TrendItem {
  name: string;
  [category: string]: number | string;
}

export interface EmpleadoChartItem {
  nombre: string;
  servicios: number;
}

export interface ServiciosReportData {
  kpis: {
    ingresos: number;
    ticket: number;
    efectividad: number;
    cancelados: number;
    margenBruto: number;
    horasOperativas: number;
  };
  trend: TrendItem[];
  categoriesMetaData: { key: string; name: string; color: string }[];
  donut: { name: string; value: number; color: string }[];
  chartEmpleados: EmpleadoChartItem[];
  servicesList: { id: number; label: string; value: number; displayValue: string }[];
  table: { id: string; nombre: string; categoria: string; cantidad: number; ingresos: number; porcentajeVentas: number; tendencia: string }[];
}

export function useServiciosReport() {
  const [data, setData] = useState<ServiciosReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [activePeriod, setActivePeriod] = useState<"hoy" | "semana" | "mes" | "anio">("mes");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      
      if (!fechaInicio && !fechaFin) {
          const now = new Date();
          let start = new Date();
          let end = new Date();
          
          if (activePeriod === 'hoy') {
              start.setHours(0,0,0,0);
              end.setHours(23,59,59,999);
          } else if (activePeriod === 'semana') {
              const day = start.getDay();
              const diff = start.getDate() - day + (day === 0 ? -6 : 1);
              start = new Date(start.setDate(diff));
              start.setHours(0,0,0,0);
          } else if (activePeriod === 'mes') {
              start = new Date(now.getFullYear(), now.getMonth(), 1);
          } else if (activePeriod === 'anio') {
              start = new Date(now.getFullYear(), 0, 1);
          }
          
          const toLocalYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          params.append('fechaInicio', toLocalYMD(start));
          params.append('fechaFin', toLocalYMD(end));
      }

      const response = await apiClient.get<{ success: boolean; data: ServiciosReportData }>(`/reportes/servicios?${params.toString()}`);
      setData(response.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar el reporte";
      setError(msg);
      console.error("Error useServiciosReport:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fechaInicio, fechaFin, activePeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQuickFilter = (type: "hoy" | "semana" | "mes" | "anio") => {
    setActivePeriod(type);
    setFechaInicio("");
    setFechaFin("");
  };

  const handleClearFilters = () => {
    setFechaInicio("");
    setFechaFin("");
    setActivePeriod("mes");
  };

  return {
    data,
    isLoading,
    error,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    activePeriod,
    handleQuickFilter,
    handleClearFilters,
    refresh: fetchData
  };
}
