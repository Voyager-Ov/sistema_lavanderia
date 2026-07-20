"use client"

import React, { useEffect, useState } from "react"
import { cn } from "@/shared/lib/utils"

interface RadialSegmentedGaugeProps {
  title: string
  subtitle?: string
  value: number
  maxValue?: number
  accentColor?: string
  className?: string
}

export function RadialSegmentedGauge({
  title,
  subtitle,
  value,
  maxValue = 100,
  accentColor = "#111827", // Default to gray-900 (black)
  className
}: RadialSegmentedGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    // Simple entry animation
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 100)
    return () => clearTimeout(timer)
  }, [value])

  const percentage = Math.min(Math.max(animatedValue / maxValue, 0), 1)
  
  // Total ticks to draw the half circle
  const totalTicks = 40
  const activeTicks = Math.round(percentage * totalTicks)

  return (
    <div className={cn(
      "bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm relative flex flex-col items-center overflow-hidden",
      className
    )}>
      <div className="w-full flex justify-between items-start mb-6 z-10">
        <h3 className="text-sm md:text-base font-extrabold text-gray-900 tracking-wider uppercase">
          {title}
        </h3>
        <div className="bg-gray-100 text-gray-900 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">
          This Month
        </div>
      </div>

      <div className="relative w-full aspect-[2/1] max-w-[300px] flex justify-center items-end mt-4">
        {/* The Ticks */}
        <div className="absolute inset-0 flex justify-center items-end overflow-hidden pb-[2%]">
          {Array.from({ length: totalTicks }).map((_, i) => {
            // Calculate angle from -90 to +90 degrees
            const angle = -90 + (i * (180 / (totalTicks - 1)))
            const isActive = i < activeTicks

            return (
              <div
                key={i}
                className="absolute w-[6px] h-[30%] origin-bottom transition-colors duration-500 ease-out"
                style={{
                  transform: `rotate(${angle}deg) translateY(-220%)`,
                  backgroundColor: isActive ? accentColor : "#E5E7EB", // gray-200 for inactive
                  borderRadius: "2px",
                }}
              />
            )
          })}
        </div>

        {/* Center Value */}
        <div className="z-10 flex flex-col items-center">
          <span className="text-[4rem] font-black text-gray-900 leading-none tracking-tighter" style={{ color: accentColor }}>
            {Math.round(animatedValue)}<span className="text-[2.5rem]">%</span>
          </span>
        </div>
      </div>

      {subtitle && (
        <p className="mt-4 text-sm font-bold text-gray-400 tracking-wide uppercase text-center w-full z-10">
          {subtitle}
        </p>
      )}
    </div>
  )
}
