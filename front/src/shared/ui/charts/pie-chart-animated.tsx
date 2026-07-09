"use client"

import React, { useRef } from "react"
import { 
  PieChart, 
  Pie, 
  Cell,
  Tooltip, 
  ResponsiveContainer
} from "recharts"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

interface PieChartAnimatedProps {
  data: any[]
  dataKey: string
  nameKey: string
  title: string
  subtitle?: string
  colors?: string[]
  delay?: number
}

export function PieChartAnimated({
  data,
  dataKey,
  nameKey,
  title,
  subtitle,
  colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"],
  delay = 0,
}: PieChartAnimatedProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ delay })
    
    tl.from(containerRef.current, {
      y: 60,
      opacity: 0,
      scale: 0.95,
      duration: 1.2,
      ease: "power4.out",
    })
    
    tl.from(".chart-text", {
      y: 15,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
    }, "-=0.8")

    // Legend stagger
    tl.from(".legend-item", {
      x: -15,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: "back.out(1.5)",
    }, "-=0.6")

  }, { scope: containerRef })

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 backdrop-blur-xl border border-white p-4 rounded-3xl shadow-[0_15px_35px_rgba(0,0,0,0.1)] text-center min-w-[120px]">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">{payload[0].name}</p>
          <p 
            className="text-3xl font-black"
            style={{ color: payload[0].payload.fill }}
          >
            {payload[0].value}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div 
      ref={containerRef}
      className="relative group bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-6 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 w-full h-full flex flex-col items-center overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-gradient-to-tr from-blue-400/10 to-emerald-400/10 rounded-full blur-[40px] -z-10 group-hover:from-blue-400/20 group-hover:to-emerald-400/20 transition-all duration-700 pointer-events-none"></div>

      <div className="mb-6 w-full text-center relative z-10">
        <h3 className="chart-text text-sm font-bold text-gray-400 tracking-widest uppercase">{title}</h3>
        {subtitle && <p className="chart-text text-3xl font-black text-gray-900 mt-2 tracking-tight">{subtitle}</p>}
      </div>
      
      <div className="w-full flex-1 min-h-[220px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Pie
              data={data}
              innerRadius={70}
              outerRadius={105}
              paddingAngle={6}
              cornerRadius={12}
              dataKey={dataKey}
              nameKey={nameKey}
              stroke="none"
              animationDuration={1500}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} className="drop-shadow-sm hover:opacity-80 transition-opacity" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full mt-6 flex flex-wrap justify-center gap-4 relative z-10">
        {data.map((item, index) => (
          <div key={index} className="legend-item flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full shadow-sm border border-white/50">
            <div 
              className="w-3 h-3 rounded-full shadow-inner" 
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-xs font-bold text-gray-600">{item[nameKey]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
