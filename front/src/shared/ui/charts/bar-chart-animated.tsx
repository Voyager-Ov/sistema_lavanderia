"use client"

import React, { useRef } from "react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

interface BarChartAnimatedProps {
  data: any[]
  dataKeyX: string
  dataKeyY: string
  title: string
  subtitle?: string
  colors?: string[]
  delay?: number
}

export function BarChartAnimated({
  data,
  dataKeyX,
  dataKeyY,
  title,
  subtitle,
  colors = ["#f59e0b", "#f97316", "#ef4444", "#ec4899"],
  delay = 0,
}: BarChartAnimatedProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ delay })
    
    tl.from(containerRef.current, {
      scale: 0.9,
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "back.out(1.5)",
    })
    
    tl.from(".chart-text", {
      x: -20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: "power2.out",
    }, "-=0.6")
  }, { scope: containerRef })

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 backdrop-blur-md border border-gray-100 p-4 rounded-[1.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: payload[0].payload.fill || colors[0] }}
          >
            #
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">{payload[0].payload[dataKeyX]}</p>
            <p className="text-xl font-black text-gray-900">{payload[0].value}</p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div 
      ref={containerRef}
      className="relative group bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-6 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 w-full h-full flex flex-col overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-orange-400/10 rounded-full blur-[60px] -z-10 group-hover:bg-orange-500/20 transition-colors duration-700 pointer-events-none"></div>

      <div className="mb-8 relative z-10">
        <h3 className="chart-text text-sm font-bold text-gray-400 tracking-widest uppercase">{title}</h3>
        {subtitle && <p className="chart-text text-3xl font-black text-gray-900 mt-2 tracking-tight">{subtitle}</p>}
      </div>
      
      <div className="w-full flex-1 min-h-[300px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
            barGap={12}
          >
            <XAxis 
              type="number"
              axisLine={false} 
              tickLine={false} 
              tick={false}
            />
            <YAxis 
              type="category"
              dataKey={dataKeyX} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 13, fontWeight: 700 }}
              width={100}
            />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 16 }} content={<CustomTooltip />} />
            <Bar 
              dataKey={dataKeyY} 
              radius={[16, 16, 16, 16]}
              animationDuration={1500}
              animationEasing="ease-out"
              barSize={32}
              background={{ fill: 'rgba(0,0,0,0.03)', radius: 16 }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
