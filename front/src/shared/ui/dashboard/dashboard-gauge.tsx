"use client"

import React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "@/shared/lib/utils"

interface DashboardGaugeProps {
  title: string
  currentValue: number
  targetValue: number
  subtitle?: string
  color?: "blue" | "green" | "yellow" | "red"
  className?: string
}

export function DashboardGauge({
  title,
  currentValue,
  targetValue,
  subtitle,
  color = "blue",
  className
}: DashboardGaugeProps) {
  
  const getCssColor = () => {
    switch(color) {
      case "green": return "var(--color-brand-green)"
      case "yellow": return "var(--color-brand-yellow)"
      case "red": return "var(--color-brand-red)"
      default: return "var(--color-brand-blue)"
    }
  }
  
  const getBgColorClass = () => {
    switch(color) {
      case "green": return "bg-brand-green"
      case "yellow": return "bg-brand-yellow"
      case "red": return "bg-brand-red"
      default: return "bg-brand-blue"
    }
  }

  // Calculate percentage
  const percentage = Math.min(Math.round((currentValue / targetValue) * 100), 100)

  // Data for the gauge: [completed, remaining]
  const data = [
    { name: "Completado", value: currentValue },
    { name: "Faltante", value: Math.max(targetValue - currentValue, 0) }
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const isCompletado = payload[0].payload.name === "Completado"
      return (
        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xl flex flex-col gap-2 min-w-[160px]">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {isCompletado ? "Progreso Actual" : "Por Completar"}
          </p>
          <div className="flex items-center justify-between gap-4 mt-1">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm shadow-sm" 
                style={{ background: isCompletado ? getCssColor() : "repeating-linear-gradient(45deg, transparent, transparent 2px, #d1d5db 2px, #d1d5db 4px)" }} 
              />
              <span className="text-sm text-gray-700 font-medium">{payload[0].name}</span>
            </div>
            <span className="text-base font-black text-gray-900">{payload[0].value}</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className={cn("bg-white rounded-[2rem] p-6 lg:p-8 flex flex-col items-center justify-between border border-gray-100 shadow-sm relative", className)}>
      <h3 className="text-lg font-semibold text-gray-900 w-full text-left mb-4">{title}</h3>
      
      <div className="relative w-full h-[180px] flex items-end justify-center overflow-hidden mt-4">
        <ResponsiveContainer width="100%" height="200%">
          <PieChart>
            <defs>
              <pattern id="stripe-pattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                <line x1="0" y="0" x2="0" y2="8" stroke="#e5e7eb" strokeWidth="2" strokeOpacity="1" />
              </pattern>
            </defs>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Pie
              data={data}
              cx="50%"
              cy="100%" // Center y at the bottom to show only top half
              startAngle={180}
              endAngle={0}
              innerRadius={80}
              outerRadius={120}
              cornerRadius={20}
              paddingAngle={-20} // Negative padding to make them overlap nicely or just 0
              dataKey="value"
              stroke="none"
              animationDuration={1500}
            >
              <Cell fill={getCssColor()} className="drop-shadow-sm" /> {/* Brand color for progress */}
              <Cell fill="url(#stripe-pattern)" /> {/* Striped grey for remaining */}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Absolute positioned text in the middle of the semi-circle */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center pb-2">
          <span className="text-5xl font-bold text-gray-900 tracking-tighter">{percentage}%</span>
          {subtitle && <span className="text-xs font-medium text-gray-500 mt-1">{subtitle}</span>}
          <span className="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-widest">{currentValue} / {targetValue} META</span>
        </div>
      </div>

      <div className="w-full flex justify-center gap-6 mt-8">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", getBgColorClass())}></div>
          <span className="text-xs font-medium text-gray-500">Completado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
             <div className="w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #d1d5db 2px, #d1d5db 4px)' }}></div>
          </div>
          <span className="text-xs font-medium text-gray-500">Pendiente</span>
        </div>
      </div>
    </div>
  )
}
