"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface CajaGraficoBalanceProps {
  totalesPorMetodo: {
    metodoPagoId: number;
    nombre: string;
    ingresos: number;
    egresos: number;
  }[];
}

export function CajaGraficoBalance({ totalesPorMetodo }: CajaGraficoBalanceProps) {
  // Asegurarnos de que tenemos datos, sino mostrar un mensaje vacío
  if (!totalesPorMetodo || totalesPorMetodo.length === 0) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200 h-full flex flex-col items-center justify-center min-h-[300px]">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Balance por Método</h3>
        <p className="text-slate-400 text-sm">No hay movimientos registrados.</p>
      </div>
    );
  }

  // Preparar datos para el gráfico
  const chartData = totalesPorMetodo.map(t => ({
    name: t.nombre,
    Ingresos: t.ingresos,
    Egresos: t.egresos,
  }));

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-200 h-full flex flex-col">
      <h3 className="text-lg font-bold text-slate-800 mb-6">Balance por Método</h3>
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any, name: any) => [`$${Number(value).toLocaleString('es-AR')}`, name]}
            />
            <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 4, 4]} barSize={32} />
            <Bar dataKey="Egresos" fill="#ef4444" radius={[4, 4, 4, 4]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-sm text-slate-600 font-medium">Ingresos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm text-slate-600 font-medium">Egresos</span>
        </div>
      </div>
    </div>
  )
}
