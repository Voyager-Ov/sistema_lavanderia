"use client"
import React, { useMemo } from "react"
import { MovimientoFinanciero } from "@/domains/finanzas/finanzas.api"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie, ComposedChart, LineChart, Line
} from "recharts"

interface FinanzasChartsProps {
  movimientos: MovimientoFinanciero[]
  isLoading: boolean
}

export function FinanzasCharts({ movimientos, isLoading }: FinanzasChartsProps) {
  
  // Transform data for AreaChart (Evolution over time)
  const evolutionData = useMemo(() => {
    if (!movimientos.length) return [];
    
    // Agrupar por fecha (YYYY-MM-DD)
    const grouped = movimientos.reduce((acc, mov) => {
      const dateStr = new Date(mov.fecha).toISOString().split('T')[0];
      if (!acc[dateStr]) acc[dateStr] = { date: dateStr, ingresos: 0, egresos: 0 };
      if (mov.tipoMovimiento === 'INGRESO') acc[dateStr].ingresos += mov.monto;
      else acc[dateStr].egresos += mov.monto;
      return acc;
    }, {} as Record<string, { date: string, ingresos: number, egresos: number }>);

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [movimientos]);

  // Transform data for PieChart (Gastos por Categoría)
  const gastosPorCategoria = useMemo(() => {
    if (!movimientos.length) return [];
    const gastos = movimientos.filter(m => m.tipoMovimiento === 'EGRESO');
    const grouped = gastos.reduce((acc, g) => {
      const cat = String(g.referenciaId);
      acc[cat] = (acc[cat] || 0) + g.monto;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5
  }, [movimientos]);

  // Transform data for PieChart (Ingresos por Método de Pago)
  const ingresosPorMetodo = useMemo(() => {
    if (!movimientos.length) return [];
    const ingresos = movimientos.filter(m => m.tipoMovimiento === 'INGRESO');
    const grouped = ingresos.reduce((acc, i) => {
      const metodo = String(i.metodoPago || 'Desconocido');
      acc[metodo] = (acc[metodo] || 0) + i.monto;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5
  }, [movimientos]);

  // Transform data for PieChart (Egresos por Método de Pago)
  const egresosPorMetodo = useMemo(() => {
    if (!movimientos.length) return [];
    const egresos = movimientos.filter(m => m.tipoMovimiento === 'EGRESO');
    const grouped = egresos.reduce((acc, i) => {
      const metodo = String(i.metodoPago || 'Desconocido');
      acc[metodo] = (acc[metodo] || 0) + i.monto;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [movimientos]);

  // Transform data for BarChart (Ingresos vs Egresos por Día de la Semana)
  const diaSemanaData = useMemo(() => {
    if (!movimientos.length) return [];
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const grouped = movimientos.reduce((acc, m) => {
      const date = new Date(m.fecha);
      const dia = dias[date.getDay()];
      if (!acc[dia]) acc[dia] = { name: dia, ingresos: 0, egresos: 0 };
      if (m.tipoMovimiento === 'INGRESO') acc[dia].ingresos += m.monto;
      else acc[dia].egresos += m.monto;
      return acc;
    }, {} as Record<string, { name: string, ingresos: number, egresos: number }>);

    return dias.map(d => grouped[d] || { name: d, ingresos: 0, egresos: 0 });
  }, [movimientos]);

  // Transform data for BarChart (Ranking Cajeros)
  const rankingCajerosData = useMemo(() => {
    if (!movimientos.length) return [];
    const ingresos = movimientos.filter(m => m.tipoMovimiento === 'INGRESO');
    const grouped = ingresos.reduce((acc, i) => {
      const cajero = String(i.registradoPor || 'Desconocido');
      acc[cajero] = (acc[cajero] || 0) + i.monto;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [movimientos]);

  // Transform data for ComposedChart (Volumen) and LineChart (Ticket Promedio)
  const { volumenData, ticketPromedioData } = useMemo(() => {
    if (!movimientos.length) return { volumenData: [], ticketPromedioData: [] };
    const ingresos = movimientos.filter(m => m.tipoMovimiento === 'INGRESO');
    
    const grouped = ingresos.reduce((acc, i) => {
      const dateStr = new Date(i.fecha).toISOString().split('T')[0];
      if (!acc[dateStr]) acc[dateStr] = { date: dateStr, montoTotal: 0, cantidad: 0 };
      acc[dateStr].montoTotal += i.monto;
      acc[dateStr].cantidad += 1;
      return acc;
    }, {} as Record<string, { date: string, montoTotal: number, cantidad: number }>);

    const sorted = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
    
    const tkPromedio = sorted.map(d => ({
      date: d.date,
      promedio: d.cantidad > 0 ? d.montoTotal / d.cantidad : 0
    }));

    return { volumenData: sorted, ticketPromedioData: tkPromedio };
  }, [movimientos]);

  const COLORS = ['#2563eb', '#059669', '#ea580c', '#e11d48', '#8b5cf6'];
  const COLORS_ALT = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
          <p className="font-bold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm font-medium">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-500">{entry.name}:</span>
              <span className="text-gray-900">${entry.value.toLocaleString('es-AR')}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 xl:col-span-3 h-[400px] bg-gray-100 animate-pulse rounded-3xl" />
        <div className="h-[350px] bg-gray-100 animate-pulse rounded-3xl" />
        <div className="lg:col-span-2 h-[350px] bg-gray-100 animate-pulse rounded-3xl" />
        <div className="h-[350px] bg-gray-100 animate-pulse rounded-3xl" />
      </div>
    )
  }

  if (movimientos.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
      
      {/* 1. Evolución Temporal */}
      <div className="lg:col-span-2 xl:col-span-3 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-6">Evolución de Flujos</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#94a3b8' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="ingresos" 
                name="Ingresos"
                stroke="#059669" 
                fill="#10b981" 
                fillOpacity={0.2}
                strokeWidth={3}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#059669' }}
              />
              <Area 
                type="monotone" 
                dataKey="egresos" 
                name="Egresos"
                stroke="#e11d48" 
                fill="#f43f5e" 
                fillOpacity={0.2}
                strokeWidth={3}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#e11d48' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Día de la semana */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-6">Flujo por Día</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={diaSemanaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-sm font-medium text-gray-700">{value}</span>}/>
              <Bar dataKey="ingresos" name="Ingresos" stackId="a" fill="#10b981" />
              <Bar dataKey="egresos" name="Egresos" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Volumen vs Transacciones */}
      <div className="lg:col-span-2 xl:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-6">Volumen vs Transacciones</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={volumenData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-sm font-medium text-gray-700">{value}</span>}/>
              <Bar yAxisId="left" dataKey="montoTotal" name="Volumen ($)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              <Line yAxisId="right" type="monotone" dataKey="cantidad" name="Cant. Transacciones" stroke="#ea580c" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Ticket Promedio */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-6">Ticket Promedio</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ticketPromedioData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `$${val.toFixed(0)}`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="promedio" name="Ticket Promedio" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Ranking Cajeros */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-6">Ranking Cajeros</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rankingCajerosData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Ingresos" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Top Gastos */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-6">Top 5 Gastos</h3>
        {gastosPorCategoria.length > 0 ? (
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gastosPorCategoria}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {gastosPorCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-sm font-medium text-gray-700">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-gray-400 font-medium">No hay egresos</p>
          </div>
        )}
      </div>

      {/* 7. Ingresos por Método */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-6">Ingresos por Método</h3>
        {ingresosPorMetodo.length > 0 ? (
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ingresosPorMetodo}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {ingresosPorMetodo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_ALT[index % COLORS_ALT.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-sm font-medium text-gray-700">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-gray-400 font-medium">No hay ingresos</p>
          </div>
        )}
      </div>

      {/* 8. Egresos por Método */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-6">Egresos por Método</h3>
        {egresosPorMetodo.length > 0 ? (
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={egresosPorMetodo}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {egresosPorMetodo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="text-sm font-medium text-gray-700">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-gray-400 font-medium">No hay egresos</p>
          </div>
        )}
      </div>

    </div>
  )
}
