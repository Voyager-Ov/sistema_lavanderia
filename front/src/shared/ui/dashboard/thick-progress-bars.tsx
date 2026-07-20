"use client"

import React, { useEffect, useState } from "react"
import { cn } from "@/shared/lib/utils"

interface ProgressItem {
  id: string | number
  label: string
  value: number
  displayValue?: string
}

interface ThickProgressBarsProps {
  title: string
  subtitle?: string
  data: ProgressItem[]
  accentColor?: string
  className?: string
}

export function ThickProgressBars({
  title,
  subtitle,
  data,
  accentColor = "#0055FF", // Blue from the reference
  className
}: ThickProgressBarsProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Find max value to calculate percentages
  const maxVal = Math.max(...data.map(d => d.value), 1)

  return (
    <div className={cn(
      "bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col",
      className
    )}>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-sm md:text-base font-extrabold text-gray-900 tracking-wider uppercase">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">
              {subtitle}
            </p>
          )}
        </div>
        <div className="text-xl font-black text-gray-900">
          Top 5
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        {data.map((item, index) => {
          const percentage = (item.value / maxVal) * 100
          
          return (
            <div key={item.id} className="w-full">
              <div className="flex justify-between items-end mb-2 px-1">
                <span className="text-sm font-bold text-gray-900">{item.label}</span>
                <span className="text-sm font-black text-gray-900">{item.displayValue || item.value}</span>
              </div>
              
              <div className="w-full h-8 bg-gray-100 rounded-2xl overflow-hidden relative border border-gray-200">
                {/* The thick progressive bar */}
                <div 
                  className="h-full rounded-2xl transition-all duration-1000 ease-out border-r-2 border-gray-900/10"
                  style={{ 
                    width: isLoaded ? `${percentage}%` : '0%',
                    backgroundColor: accentColor 
                  }}
                >
                   {/* Optional: Add inner highlight/texture */}
                   <div className="w-full h-full opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
