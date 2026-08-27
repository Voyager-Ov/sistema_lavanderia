import { useState, useCallback, useEffect } from 'react';
import { reportesApi, ReportePedidosData } from '@/domains/reportes/api/reportes.api';

export type { ReportePedidosData as PedidosReportData };

export function usePedidosReport() {
  const [data, setData] = useState<ReportePedidosData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [activePeriod, setActivePeriod] = useState<"hoy" | "semana" | "mes" | "anio">("mes");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let queryInicio = fechaInicio;
      let queryFin = fechaFin;
      
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
          queryInicio = toLocalYMD(start);
          queryFin = toLocalYMD(end);
      }

      const resData = await reportesApi.obtenerReportePedidos({
        fechaInicio: queryInicio || undefined,
        fechaFin: queryFin || undefined
      });
      setData(resData);
    } catch (err: any) {
      setError(err?.message || "Error al cargar el reporte de pedidos");
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
