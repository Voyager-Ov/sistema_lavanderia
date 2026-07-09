"use client"

import React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { cn } from "@/shared/lib/utils"

interface DashboardBarChartProps {
  data: any[]
  dataKeyX: string
  dataKeyY: string
  title: string
  unit?: string
  className?: string
}

export function DashboardBarChart({
  data,
  dataKeyX,
  dataKeyY,
  title,
  unit = "un.",
  className
}: DashboardBarChartProps) {
  
  // Custom tooltip to match the clean aesthetic and shadcn style
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-lg flex flex-col gap-2 min-w-[140px]">
          <p className="text-sm font-semibold text-gray-900 mb-1">{data.payload[dataKeyX]}</p>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ background: data.payload.isSolid ? (data.payload.color || "var(--color-brand-blue)") : "url(#diagonal-stripe)" }} 
              />
              <span className="text-sm text-gray-500 font-medium capitalize">{dataKeyY}</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{data.value} {unit}</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className={cn("bg-white rounded-[2rem] p-6 lg:p-8 flex flex-col border border-gray-100 shadow-sm", className)}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <div className="w-full flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            barGap={8}
          >
            <defs>
              {/* Pattern for striped bars (like the reference image) */}
              <pattern id="diagonal-stripe" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                <line x1="0" y="0" x2="0" y2="10" stroke="#9ca3af" strokeWidth="3" strokeOpacity="0.4" />
              </pattern>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey={dataKeyX}
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 500 }}
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(value) => `${value} ${unit}`}
              tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
              dx={-10}
              width={60}
            />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 30 }} content={<CustomTooltip />} />
            
            <Bar 
              dataKey={dataKeyY} 
              radius={[30, 30, 30, 30]} // Full pill shape
              barSize={40} // Very thick bars
              animationDuration={1500}
            >
              {data.map((entry, index) => {
                // Determine if bar is solid or striped based on its value relative to others, 
                // or just alternating for the visual effect shown in the image.
                // In the image, the middle bars are solid dark green and light green, edges are striped.
                const isSolid = entry.isSolid // We can pass an isSolid flag in data
                
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={isSolid ? (entry.color || "var(--color-brand-blue)") : "url(#diagonal-stripe)"} 
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
