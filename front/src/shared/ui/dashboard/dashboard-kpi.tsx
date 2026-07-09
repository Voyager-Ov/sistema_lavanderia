"use client"

import React, { useRef, useState } from "react"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { cn } from "@/shared/lib/utils"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(useGSAP)

interface DashboardKpiProps {
  title: string
  value: string | number
  trendValue?: number | string
  subtitle?: string
  backMessage?: string
  variant?: "default" | "active"
  className?: string
  icon?: React.ReactNode
  href?: string
}

export function DashboardKpi({
  title,
  value,
  trendValue,
  subtitle,
  backMessage = "Información detallada de este KPI.",
  variant = "default",
  className,
  icon,
  href
}: DashboardKpiProps) {
  const isActive = variant === "active"
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
  let parsedTrend = typeof trendValue === 'string' ? parseFloat(trendValue) : trendValue;

  if (parsedTrend && parsedTrend > 0) {
    trendIcon = <ArrowUpRight className="w-3 h-3" />
    trendColor = isActive ? "text-blue-100" : "text-green-600"
    trendBg = isActive ? "bg-white/20" : "bg-green-100/50"
  } else if (parsedTrend && parsedTrend < 0) {
    trendIcon = <ArrowDownRight className="w-3 h-3" />
    trendColor = isActive ? "text-red-100" : "text-red-600"
    trendBg = isActive ? "bg-white/20" : "bg-red-100/50"
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Only flip if clicking on the card itself, not the link button
    const target = e.target as HTMLElement
    if (!target.closest('a')) {
      setIsFlipped(!isFlipped)
    }
  }

  // The button rendering logic
  const ActionButton = () => {
    const btnClass = cn(
      "w-10 h-10 rounded-full flex items-center justify-center border transition-transform hover:scale-110 active:scale-95",
      isActive 
        ? "bg-white text-brand-blue border-transparent shadow-sm" 
        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
    )

    if (href) {
      return (
        <Link href={href} className={btnClass}>
          {icon ? icon : <ArrowUpRight className="w-5 h-5" />}
        </Link>
      )
    }

    return (
      <div className={btnClass}>
        {icon ? icon : <ArrowUpRight className="w-5 h-5" />}
      </div>
    )
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
            "absolute inset-0 [backface-visibility:hidden] rounded-[2rem] p-6 lg:p-8 flex flex-col justify-between overflow-hidden",
            isActive 
              ? "bg-brand-blue text-white shadow-brand-blue/20" 
              : "bg-white text-gray-900 border border-gray-100"
          )}
        >
          <div className="flex justify-between items-start mb-6">
            <h3 className={cn(
              "text-base font-medium",
              isActive ? "text-blue-50" : "text-gray-900"
            )}>
              {title}
            </h3>
            
            <ActionButton />
          </div>

          <div>
            <p className={cn(
              "text-5xl lg:text-6xl font-semibold tracking-tight mb-4",
              isActive ? "text-white" : "text-gray-900"
            )}>
              {value}
            </p>

            <div className="flex items-center gap-3">
              {trendValue && (
                <div className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold", trendBg, trendColor)}>
                  <span>{trendValue}%</span>
                  {trendIcon}
                </div>
              )}
              {subtitle && (
                <span className={cn(
                  "text-xs font-medium",
                  isActive ? "text-blue-100/80" : "text-gray-400"
                )}>
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div 
          className={cn(
            "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[2rem] p-6 lg:p-8 flex flex-col justify-center items-center text-center border",
            isActive 
              ? "bg-blue-800 text-white border-blue-700" 
              : "bg-gray-50 text-gray-900 border-gray-200"
          )}
        >
          <h4 className={cn("text-lg font-bold mb-2", isActive ? "text-white" : "text-brand-blue")}>
            ¿Qué significa?
          </h4>
          <p className={cn("text-sm font-medium", isActive ? "text-blue-100" : "text-gray-600")}>
            {backMessage}
          </p>
        </div>
      </div>
    </div>
  )
}
