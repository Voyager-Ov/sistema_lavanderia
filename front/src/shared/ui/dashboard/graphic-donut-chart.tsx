"use client"

import React from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { cn } from "@/shared/lib/utils"

interface GraphicDonutChartProps {
  data: { name: string; value: number; color: string }[]
  title: string
  subtitle?: string
  className?: string
}

export function GraphicDonutChart({
  data,
  title,
  subtitle,
  className
}: GraphicDonutChartProps) {
  
  const totalSum = data.reduce((acc, curr) => acc + (curr.value || 0), 0)
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value || 0
      const pct = totalSum > 0 ? ((val / totalSum) * 100).toFixed(1) : "0"
      return (
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-3 rounded-xl shadow-lg flex flex-col gap-1 min-w-[140px]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }} />
            <span className="text-sm font-medium text-gray-500 dark:text-neutral-400">{payload[0].name}</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-neutral-100">{val.toLocaleString()} ({pct}%)</span>
        </div>
      )
    }
    return null
  }

  return (
    <div className={cn(
      "bg-white dark:bg-neutral-900 rounded-[2rem] p-6 lg:p-8 flex flex-col items-center justify-center border border-gray-100 dark:border-neutral-800 shadow-sm relative",
      className
    )}>
      <div className="w-full flex justify-between items-start mb-2 z-10">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-neutral-100">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm font-medium text-gray-500 dark:text-neutral-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      <div className="w-full flex-1 aspect-square max-h-[300px] relative mt-4">
        {/* Decorative background subtle circle */}
        <div className="absolute inset-4 rounded-full border border-gray-50 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-800/40" />

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              innerRadius="65%"
              outerRadius="90%"
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              cornerRadius={10}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-gray-900 dark:text-neutral-100">{totalSum.toLocaleString()}</span>
          <span className="text-xs font-medium text-gray-500 dark:text-neutral-400 mt-1">Total</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="w-full flex flex-wrap justify-center gap-4 mt-6">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs font-medium text-gray-700 dark:text-neutral-300 max-w-[140px] truncate" title={item.name}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
