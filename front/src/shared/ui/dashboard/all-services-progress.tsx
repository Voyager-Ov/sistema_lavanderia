"use client"

import React, { useEffect, useState } from "react"
import { cn } from "@/shared/lib/utils"

interface ProgressItem {
  id: string | number
  label: string
  value: number
  displayValue?: string
}

interface AllServicesProgressProps {
  title: string
  subtitle?: string
  data: ProgressItem[]
  accentColor?: string
  className?: string
}

export function AllServicesProgress({
  title,
  subtitle,
  data,
  accentColor = "#3b82f6", // Default blue-500
  className
}: AllServicesProgressProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Find max value to calculate percentages
  const maxVal = Math.max(...data.map(d => d.value), 1)

  return (
    <div className={cn(
      "bg-white rounded-[2rem] p-6 lg:p-8 border border-gray-100 shadow-sm flex flex-col",
      className
    )}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm font-medium text-gray-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="text-sm font-medium text-brand-blue bg-blue-50 px-3 py-1 rounded-full">
          {data.length} Servicios
        </div>
      </div>

      <div className="flex-1 pr-4 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col gap-5 pb-4">
          {data.map((item) => {
            const percentage = maxVal === 0 ? 0 : (item.value / maxVal) * 100
            const isEmpty = item.value === 0
            
            return (
              <div key={item.id} className="w-full">
                <div className="flex justify-between items-end mb-2 px-1">
                  <span className={cn(
                    "text-sm font-medium",
                    isEmpty ? "text-gray-400" : "text-gray-900"
                  )}>
                    {item.label}
                  </span>
                  <span className={cn(
                    "text-sm font-bold",
                    isEmpty ? "text-gray-400" : "text-gray-900"
                  )}>
                    {item.displayValue || item.value}
                  </span>
                </div>
                
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: isLoaded ? `${percentage}%` : '0%',
                      backgroundColor: isEmpty ? '#e5e7eb' : accentColor 
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
