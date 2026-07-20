"use client"

import React from "react"
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
  categories,
  title,
  subtitle,
  className
}: EditorialTrendChartProps) {
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-lg flex flex-col gap-2 min-w-[200px]">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">{label}</p>
          <div className="flex flex-col gap-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">${entry.value.toLocaleString()}</span>
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
      "bg-white rounded-[2rem] p-6 lg:p-8 flex flex-col border border-gray-100 shadow-sm",
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
      </div>
      
      <div className="w-full flex-1 min-h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              {categories.map((cat, index) => (
                <linearGradient key={`grad-${cat.key}`} id={`grad-${cat.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cat.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={cat.color} stopOpacity={0}/>
                </linearGradient>
              ))}
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
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Legend 
              iconType="circle" 
              wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '20px' }}
            />
            
            {categories.map((cat, index) => (
              <Area 
                key={cat.key}
                type="monotone" 
                dataKey={cat.key}
                name={cat.name}
                stroke={cat.color}
                strokeWidth={3}
                fillOpacity={1}
                fill={`url(#grad-${cat.key})`}
                activeDot={{ r: 6, stroke: cat.color, strokeWidth: 2, fill: '#fff' }}
                dot={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
