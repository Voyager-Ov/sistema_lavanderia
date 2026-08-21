"use client"

import React, { useMemo, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { cn } from "@/shared/lib/utils"

export interface GraphicDonutChartItem {
  name?: string
  value?: number
  color?: string
  [key: string]: any
}

export interface ProcessedDonutItem {
  name: string
  value: number
  color: string
  originalIndex: number
  [key: string]: any
}

export interface GraphicDonutChartProps {
  data: GraphicDonutChartItem[]
  title: string
  subtitle?: string
  className?: string
  dataKey?: string
  nameKey?: string
  centerLabel?: string
  centerValue?: string | number
  innerRadius?: string | number
  outerRadius?: string | number
  paddingAngle?: number
  cornerRadius?: number
  minAngle?: number
  valueFormatter?: (value: number) => string
  colors?: string[]
  showLegend?: boolean
  emptyMessage?: string
  aggregateDuplicates?: boolean
  showTooltip?: boolean
}

const DEFAULT_PALETTE = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#f43f5e", // rose-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
  "#84cc16", // lime-500
  "#6366f1", // indigo-500
  "#d946ef", // fuchsia-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#a855f7", // purple-500
  "#ef4444", // red-500
  "#22c55e", // green-500
]

const getDistinctColor = (index: number, total: number) => {
  if (index < DEFAULT_PALETTE.length) return DEFAULT_PALETTE[index]
  const hue = (index * (360 / Math.max(total, 1)) + 25) % 360
  return `hsl(${Math.floor(hue)}, 80%, 55%)`
}

export function GraphicDonutChart({
  data = [],
  title,
  subtitle,
  className,
  dataKey = "value",
  nameKey = "name",
  centerLabel = "Total",
  centerValue,
  innerRadius = "65%",
  outerRadius = "90%",
  paddingAngle = 2.5,
  cornerRadius = 6,
  minAngle = 3.5,
  valueFormatter,
  colors = DEFAULT_PALETTE,
  showLegend = true,
  emptyMessage = "No hay datos disponibles",
  aggregateDuplicates = false,
  showTooltip = false
}: GraphicDonutChartProps) {

  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Normalize data and assign distinct colors for all slices
  const processedData = useMemo<ProcessedDonutItem[]>(() => {
    if (!data || !Array.isArray(data)) return []

    let rawItems: ProcessedDonutItem[] = data.map((item, idx) => {
      const name = String(item[nameKey] ?? item.name ?? `Item ${idx + 1}`).trim()
      const value = Number(item[dataKey] ?? item.value ?? 0)
      return { ...item, name, value, color: "", originalIndex: idx }
    })

    if (aggregateDuplicates) {
      const map = new Map<string, ProcessedDonutItem>()
      rawItems.forEach((item) => {
        const key = item.name.toLowerCase()
        const existing = map.get(key)
        if (existing) {
          existing.value = (existing.value || 0) + item.value
        } else {
          map.set(key, { ...item })
        }
      })
      rawItems = Array.from(map.values())
    }

    return rawItems.map((item, index) => ({
      ...item,
      color: item.color || colors[index % colors.length] || getDistinctColor(index, rawItems.length)
    }))
  }, [data, dataKey, nameKey, aggregateDuplicates, colors])

  const totalSum = useMemo(() => {
    return processedData.reduce((acc, curr) => acc + (curr.value || 0), 0)
  }, [processedData])

  const activeItem = activeIndex !== null ? processedData[activeIndex] : null

  const displayedCenterText = useMemo(() => {
    if (activeItem) {
      const val = activeItem.value || 0
      const pct = totalSum > 0 ? ((val / totalSum) * 100).toFixed(1) : "0"
      const formatted = valueFormatter ? valueFormatter(val) : val.toLocaleString("es-AR")
      return {
        value: formatted,
        label: `${activeItem.name} (${pct}%)`,
        activeColor: activeItem.color
      }
    }

    let valStr = ""
    if (centerValue !== undefined) {
      valStr = String(centerValue)
    } else if (valueFormatter) {
      valStr = valueFormatter(totalSum)
    } else {
      valStr = totalSum.toLocaleString("es-AR")
    }

    return {
      value: valStr,
      label: centerLabel,
      activeColor: undefined
    }
  }, [activeItem, centerValue, totalSum, valueFormatter, centerLabel])

  return (
    <div className={cn(
      "bg-white dark:bg-neutral-900/90 rounded-[2rem] p-6 lg:p-8 flex flex-col items-center justify-between border border-gray-100 dark:border-neutral-800/80 shadow-sm relative backdrop-blur-sm transition-all hover:border-gray-200 dark:hover:border-neutral-700",
      className
    )}>
      {/* Header */}
      <div className="w-full flex justify-between items-start mb-2 z-10">
        <div>
          <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-neutral-100">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs font-medium text-gray-500 dark:text-neutral-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {/* Donut Area */}
      {processedData.length > 0 && totalSum > 0 ? (
        <div className="w-full flex-1 aspect-square max-h-[280px] min-h-[200px] relative mt-2 mb-2 flex items-center justify-center">
          {/* Subtle Decorative Inner Ring */}
          <div className="absolute inset-5 rounded-full border border-slate-100 dark:border-neutral-800/80 bg-slate-50/40 dark:bg-neutral-800/30 pointer-events-none" />

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                paddingAngle={paddingAngle}
                minAngle={minAngle}
                dataKey="value"
                nameKey="name"
                stroke="none"
                cornerRadius={cornerRadius}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {processedData.map((entry, index) => {
                  const isSelected = activeIndex === index
                  const isDimmed = activeIndex !== null && !isSelected

                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      opacity={isDimmed ? 0.15 : 1}
                      stroke={isSelected ? "#ffffff" : "none"}
                      strokeWidth={isSelected ? 2.5 : 0}
                      className="transition-all duration-200 cursor-pointer"
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    />
                  )
                })}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Text (Replaces floating tooltip!) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 text-center px-4 transition-all duration-200">
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-neutral-100 leading-none">
              {displayedCenterText.value}
            </span>
            <span 
              className={cn(
                "text-[11px] font-bold uppercase tracking-wider mt-1 truncate max-w-[170px] transition-colors",
                displayedCenterText.activeColor ? "text-slate-900 dark:text-neutral-100 font-black" : "text-gray-400 dark:text-neutral-400"
              )}
              style={displayedCenterText.activeColor ? { color: displayedCenterText.activeColor } : undefined}
            >
              {displayedCenterText.label}
            </span>
          </div>
        </div>
      ) : (
        <div className="w-full flex-1 min-h-[200px] flex items-center justify-center">
          <p className="text-sm font-medium text-gray-400 dark:text-neutral-500">{emptyMessage}</p>
        </div>
      )}
      
      {/* Interactive Legend */}
      {showLegend && processedData.length > 0 && (
        <div className="w-full flex flex-wrap justify-center gap-x-2 gap-y-1.5 mt-4 z-10 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
          {processedData.map((item, i) => {
            const isSelected = activeIndex === i
            const isDimmed = activeIndex !== null && !isSelected

            return (
              <div 
                key={`legend-${item.name}-${i}`} 
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer select-none text-xs font-semibold",
                  isSelected 
                    ? "bg-slate-100 dark:bg-neutral-800 border-slate-300 dark:border-neutral-700 shadow-xs text-slate-900 dark:text-neutral-50 scale-105 opacity-100" 
                    : isDimmed 
                      ? "opacity-25 border-transparent text-slate-400 dark:text-neutral-600 scale-95"
                      : "border-transparent bg-slate-50/60 dark:bg-neutral-800/40 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 opacity-100"
                )}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                <span className="max-w-[160px] truncate" title={item.name}>
                  {item.name}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
