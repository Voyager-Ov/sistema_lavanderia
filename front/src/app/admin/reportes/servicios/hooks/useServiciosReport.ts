import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/shared/lib/api-client';

export interface ServiciosReportData {
  kpis: {
    ingresos: number;
    ticket: number;
    capacidad: number;
    cancelados: number;
  };
  trend: any[];
  categoriesMetaData: { key: string; name: string; color: string }[];
  donut: { name: string; value: number; color: string }[];
  servicesList: { id: number; label: string; value: number; displayValue: string }[];
  table: { id: string; nombre: string; categoria: string; cantidad: number; ingresos: number; porcentajeVentas: number; tendencia: string }[];
}

export function useServiciosReport() {
  const [data, setData] = useState<ServiciosReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [activePeriod, setActivePeriod] = useState<"hoy" | "semana" | "mes" | "anio">("mes");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Construir query params
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      
      // Si no hay fechas explícitas, podríamos usar activePeriod para calcular en el frontend
      // o mandar el activePeriod al backend. El backend por defecto toma "este mes" si no enviamos fechas.
      // Para hacerlo consistente, calculamos las fechas aquí si dependemos del activePeriod y no hay fechas manuales
      
      if (!fechaInicio && !fechaFin) {
          const now = new Date();
          let start = new Date();
          let end = new Date();
          
          if (activePeriod === 'hoy') {
              start.setHours(0,0,0,0);
              end.setHours(23,59,59,999);
          } else if (activePeriod === 'semana') {
              const day = start.getDay();
              const diff = start.getDate() - day + (day == 0 ? -6:1); // Lunes
              start = new Date(start.setDate(diff));
              start.setHours(0,0,0,0);
          } else if (activePeriod === 'mes') {
              start = new Date(now.getFullYear(), now.getMonth(), 1);
          } else if (activePeriod === 'anio') {
              start = new Date(now.getFullYear(), 0, 1);
          }
          
          params.append('fechaInicio', start.toISOString().split('T')[0]);
          params.append('fechaFin', end.toISOString().split('T')[0]);
      }

      const response = await apiClient.get<any>(`/reportes/servicios?${params.toString()}`);
      setData(response.data.data);
    } catch (err: any) {
      setError(err.message || "Error al cargar el reporte");
      console.error(err);
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
