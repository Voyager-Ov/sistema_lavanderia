"use client"

import React, { useMemo } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"
import { cn } from "@/shared/lib/utils"

interface CategoryData {
  key: string
  name: string
  color: string
}

interface EditorialTrendChartProps {
  data: any[]
  dataKeyX: string
  categories: CategoryData[]
  title: string
  subtitle?: string
  className?: string
}

export function EditorialTrendChart({
  data,
  dataKeyX,
  categories = [],
  title,
  subtitle,
  className
}: EditorialTrendChartProps) {
  
  // Deduplicate categories by key/name to prevent duplicate React keys & duplicate SVG IDs
  const uniqueCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return []
    const seen = new Set<string>()
    return categories.filter((cat, idx) => {
      const rawKey = cat.key || cat.name || `cat_${idx}`
      if (seen.has(rawKey)) return false
      seen.add(rawKey)
      return true
    })
  }, [categories])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4 rounded-xl shadow-lg flex flex-col gap-2 min-w-[200px]">
          <p className="text-sm font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider border-b border-gray-100 dark:border-neutral-800 pb-2">{label}</p>
          <div className="flex flex-col gap-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">{entry.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-neutral-100">${entry.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className={cn(
      "bg-white dark:bg-neutral-900 rounded-[2rem] p-6 lg:p-8 flex flex-col border border-gray-100 dark:border-neutral-800 shadow-sm",
      className
    )}>
      <div className="flex justify-between items-start mb-6">
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
      
      <div className="w-full flex-1 min-h-[250px] relative">
        {(!data || data.length === 0) ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-6">
            <p className="text-sm font-medium">Sin datos de evolución para el período seleccionado</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                {uniqueCategories.map((cat, index) => {
                  const safeKey = String(cat.key || cat.name || index).replace(/[^a-zA-Z0-9_-]/g, "_")
                  const gradId = `grad_${safeKey}_${index}`
                  return (
                    <linearGradient key={`grad-${cat.key || index}-${index}`} id={gradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={cat.color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={cat.color} stopOpacity={0}/>
                    </linearGradient>
                  )
                })}
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey={dataKeyX}
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                dx={-10}
                tickFormatter={(value) => typeof value === 'number' ? `$${value.toLocaleString()}` : String(value)}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Legend 
                iconType="circle" 
                wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '20px' }}
              />
              
              {uniqueCategories.map((cat, index) => {
                const safeKey = String(cat.key || cat.name || index).replace(/[^a-zA-Z0-9_-]/g, "_")
                const gradId = `grad_${safeKey}_${index}`
                return (
                  <Area 
                    key={`area-${cat.key || index}-${index}`}
                    type="monotone" 
                    dataKey={cat.key}
                    name={cat.name}
                    stroke={cat.color}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill={`url(#${gradId})`}
                    activeDot={{ r: 6, stroke: cat.color, strokeWidth: 2, fill: '#fff' }}
                    dot={false}
                  />
                )
              })}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
