"use client"

import React, { useRef } from "react"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

interface AreaChartAnimatedProps {
  data: any[]
  dataKeyX: string
  dataKeyY: string
  title: string
  subtitle?: string
  color?: string
  delay?: number
}

export function AreaChartAnimated({
  data,
  dataKeyX,
  dataKeyY,
  title,
  subtitle,
  color = "#4f46e5", // Indigo/Brand Blue
  delay = 0,
}: AreaChartAnimatedProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const tl = gsap.timeline({ delay })
    
    // Contenedor elástico
    tl.from(containerRef.current, {
      y: 60,
      opacity: 0,
      duration: 1.2,
      ease: "elastic.out(1, 0.7)",
    })
    
    // Textos escalonados
    tl.from(".chart-text", {
      y: 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power3.out",
    }, "-=0.8")
  }, { scope: containerRef })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/70 backdrop-blur-xl border border-white/50 p-4 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            {payload[0].value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div 
      ref={containerRef}
      className="relative group bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-6 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:bg-white/80 transition-all duration-500 w-full overflow-hidden"
    >
      {/* Glow ambiental sutil */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] -z-10 group-hover:bg-indigo-500/20 transition-colors duration-700 pointer-events-none"></div>

      <div className="mb-8 relative z-10">
        <h2 className="chart-text text-sm font-bold text-gray-400 tracking-widest uppercase">{title}</h2>
        {subtitle && <p className="chart-text text-4xl font-black text-gray-900 mt-2 tracking-tight">{subtitle}</p>}
      </div>
      
      <div className="w-full h-[320px] lg:h-[420px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorY" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.5}/>
                <stop offset="100%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
            <XAxis 
              dataKey={dataKeyX} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 600 }}
              dy={15}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 600 }}
              tickFormatter={(value) => `$${value/1000}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 2 }} />
            <Area 
              type="monotone" 
              dataKey={dataKeyY} 
              stroke={color} 
              strokeWidth={5}
              fillOpacity={1} 
              fill="url(#colorY)" 
              animationDuration={2000}
              animationEasing="ease-out"
              activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff', fill: color, className: "drop-shadow-md" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
