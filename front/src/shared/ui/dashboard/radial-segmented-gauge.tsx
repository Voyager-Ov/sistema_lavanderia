"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/shared/lib/utils"

export interface RadialSegmentedGaugeProps {
  title: string
  subtitle?: string
  value?: number // 0 to 100 percentage or value (optional if currentValue & targetValue are supplied)
  maxValue?: number // default 100
  currentValue?: number
  targetValue?: number
  metaText?: string // e.g. "10 / 17 META"
  badgeText?: string // e.g. "Hoy" or "Este Mes"
  color?: "green" | "blue" | "orange" | "purple" | "red" | string
  accentColor?: string
  totalSegments?: number // default 10 (long, thick radial rays like sunburst arch)
  tickWidth?: number // default 14
  tickHeight?: number // default 58
  className?: string
  showLegend?: boolean
  legendLabels?: { active: string; inactive: string }
}

const COLOR_MAP: Record<string, string> = {
  green: "#10b981", // emerald-500
  blue: "#3b82f6",  // blue-500
  orange: "#ea580c",// orange-600
  purple: "#8b5cf6",// violet-500
  red: "#f43f5e",   // rose-500
}

export function RadialSegmentedGauge({
  title,
  subtitle,
  value = 0,
  maxValue = 100,
  currentValue,
  targetValue,
  metaText,
  badgeText = "Hoy",
  color = "green",
  accentColor,
  totalSegments = 100,
  tickWidth = 100,
  tickHeight = 150,   
  className,
  showLegend = true,
  legendLabels = { active: "Completado", inactive: "Pendiente" }
}: RadialSegmentedGaugeProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [animatedValue, setAnimatedValue] = useState(0)

  // Calculate actual numeric value
  const numericValue = useMemo(() => {
    if (currentValue !== undefined && targetValue !== undefined && targetValue > 0) {
      return (currentValue / targetValue) * 100
    }
    return value
  }, [value, currentValue, targetValue])

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(numericValue)
    }, 120)
    return () => clearTimeout(timer)
  }, [numericValue])

  const percentage = Math.min(Math.max(animatedValue / maxValue, 0), 1)
  const displayPercent = Math.round(percentage * 100)

  // Active color resolution
  const activeColorHex = useMemo(() => {
    if (accentColor) return accentColor
    if (color && COLOR_MAP[color]) return COLOR_MAP[color]
    if (color && color.startsWith("#")) return color
    return "#10b981" // fallback green
  }, [accentColor, color])

  const inactiveColorHex = isDark ? "rgba(255, 255, 255, 0.15)" : "#d1d5db"

  // Arch geometry parameters
  const cx = 150
  const cy = 145
  const radius = 82

  const ticks = useMemo(() => {
    const total = totalSegments
    const activeCount = Math.round(percentage * total)

    return Array.from({ length: total }).map((_, i) => {
      // Angle sweep from 180° (left, 9 o'clock) to 360° (right, 3 o'clock)
      const startAngle = 180
      const endAngle = 360
      const angleDeg = total > 1 
        ? startAngle + (i * (endAngle - startAngle) / (total - 1))
        : 270

      const angleRad = (angleDeg * Math.PI) / 180

      const x = cx + radius * Math.cos(angleRad)
      const y = cy + radius * Math.sin(angleRad)
      const rot = angleDeg + 90

      const isActive = i < activeCount

      return {
        id: i,
        x,
        y,
        rot,
        isActive
      }
    })
  }, [totalSegments, percentage, cx, cy, radius])

  // Construct default meta text if targetValue & currentValue are provided
  const finalMetaText = useMemo(() => {
    if (metaText) return metaText
    if (currentValue !== undefined && targetValue !== undefined) {
      return `${currentValue} / ${targetValue} META`
    }
    return null
  }, [metaText, currentValue, targetValue])

  return (
    <div className={cn(
      "bg-white dark:bg-neutral-900/90 rounded-[2rem] p-6 lg:p-8 border border-gray-100 dark:border-neutral-800/80 shadow-sm relative flex flex-col justify-between backdrop-blur-sm transition-all hover:border-gray-200 dark:hover:border-neutral-700",
      className
    )}>
      {/* Header */}
      <div className="w-full flex justify-between items-start mb-2 z-10">
        <div>
          <h3 className="text-lg font-black tracking-tight text-gray-900 dark:text-neutral-100">
            {title}
          </h3>
        </div>
        {badgeText && (
          <div className="bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-neutral-700/60 transition-colors">
            {badgeText}
          </div>
        )}
      </div>

      {/* Radial Sunburst Rays Arch SVG */}
      <div className="relative w-full aspect-[2/1] max-w-[300px] mx-auto flex flex-col items-center justify-end my-2">
        <svg viewBox="0 0 300 175" className="w-full h-auto max-w-[300px] overflow-visible">
          {ticks.map((tick) => (
            <rect
              key={tick.id}
              x={tick.x - tickWidth / 2}
              y={tick.y - tickHeight / 2}
              width={tickWidth}
              height={tickHeight}
              rx={tickWidth / 2}
              ry={tickWidth / 2}
              transform={`rotate(${tick.rot}, ${tick.x}, ${tick.y})`}
              className="transition-all duration-500 ease-out"
              fill={tick.isActive ? activeColorHex : inactiveColorHex}
            />
          ))}
        </svg>

        {/* Percentage text centered inside the arch near bottom */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center text-center z-10 pointer-events-none">
          <span className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-neutral-50 tracking-tight leading-none">
            {displayPercent}%
          </span>
        </div>
      </div>

      {/* Subtitle & Meta text (Below Arch Area - Clean & No Overlap!) */}
      <div className="w-full flex flex-col items-center text-center mt-2 mb-2 z-10">
        {subtitle && (
          <p className="text-xs font-semibold text-gray-500 dark:text-neutral-400 max-w-[240px]">
            {subtitle}
          </p>
        )}
        {finalMetaText && (
          <span className="text-[11px] font-extrabold text-gray-400 dark:text-neutral-500 mt-1 uppercase tracking-widest">
            {finalMetaText}
          </span>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="w-full flex justify-center items-center gap-6 mt-2 pt-3 z-10 border-t border-slate-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: activeColorHex }} />
            <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">
              {legendLabels.active}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0 bg-slate-200 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 shadow-xs" />
            <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
              {legendLabels.inactive}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
