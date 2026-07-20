"use client"

import React, { useRef, useState } from "react"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

interface ServiceReportKpiProps {
  title: string
  value: string | number
  trendValue?: number | string
  trendPrefix?: string
  trendSuffix?: string
  subtitle?: string
  backMessage?: string
  isPositive?: boolean
  className?: string
}

export function ServiceReportKpi({
  title,
  value,
  trendValue,
  trendPrefix = "+",
  trendSuffix = "%",
  subtitle = "Comparación vs periodo anterior",
  backMessage = "Información detallada de este KPI.",
  isPositive = true,
  className
}: ServiceReportKpiProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Use GSAP for the 3D flip animation
  useGSAP(() => {
    if (!cardRef.current) return
    
    gsap.to(cardRef.current, {
      rotationY: isFlipped ? 180 : 0,
      duration: 0.6,
      ease: "power3.inOut",
    })
  }, { scope: cardRef, dependencies: [isFlipped] })

  // Determine trend direction and colors
  let trendIcon = <Minus className="w-3 h-3" />
  let trendColor = "text-gray-500"
  let trendBg = "bg-gray-100"
  
  if (trendValue) {
    if (isPositive) {
      trendIcon = <ArrowUpRight className="w-3 h-3" />
      trendColor = "text-green-600"
      trendBg = "bg-green-100/50"
    } else {
      trendIcon = <ArrowDownRight className="w-3 h-3" />
      trendColor = "text-red-600"
      trendBg = "bg-red-100/50"
    }
  }

  const handleCardClick = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div 
      className={cn("relative rounded-[2rem] w-full min-h-[180px] lg:min-h-[200px] [perspective:1000px]", className)}
    >
      {/* 3D Container */}
      <div 
        ref={cardRef}
        onClick={handleCardClick}
        className="w-full h-full [transform-style:preserve-3d] cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-300 rounded-[2rem] relative"
      >
        {/* FRONT FACE */}
        <div 
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] rounded-[2rem] p-6 lg:p-8 flex flex-col justify-between overflow-hidden bg-white text-gray-900 border border-gray-100"
          )}
        >
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-medium text-gray-900">
              {title}
            </h3>
            
            {/* Pequeño indicador visual de que la tarjeta tiene acción */}
            <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
              <span className="text-[10px] font-bold">i</span>
            </div>
          </div>

          <div>
            <p className="text-4xl lg:text-5xl font-semibold tracking-tight mb-4 text-gray-900">
              {value}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {trendValue && (
                <div className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold", trendBg, trendColor)}>
                  <span>{trendPrefix}{trendValue}{trendSuffix}</span>
                  {trendIcon}
                </div>
              )}
              {subtitle && (
                <span className="text-xs font-medium text-gray-400">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div 
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[2rem] p-6 lg:p-8 flex flex-col justify-center items-center text-center border bg-gray-50 text-gray-900 border-gray-200"
          )}
        >
          <h4 className="text-lg font-bold mb-2 text-brand-blue">
            ¿Qué significa?
          </h4>
          <p className="text-sm font-medium text-gray-600">
            {backMessage}
          </p>
        </div>
      </div>
    </div>
  )
}
