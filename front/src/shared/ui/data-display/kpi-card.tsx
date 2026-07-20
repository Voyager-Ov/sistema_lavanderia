"use client"

import * as React from "react"
import { useRef, useState } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { cn } from "@/shared/lib/utils"

gsap.registerPlugin(useGSAP)

interface KpiCardProps {
  title: string
  value: string | number
  description?: string
  backMessage: string
  colorVariant?: "blue" | "green" | "orange" | "purple" | "red" | "yellow"
  className?: string
  isLoading?: boolean
}

export function KpiCard({
  title,
  value,
  description,
  backMessage,
  colorVariant = "blue",
  className,
  isLoading = false,
}: KpiCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const colors = {
    blue: "bg-brand-blue text-white",
    green: "bg-brand-green text-white",
    orange: "bg-brand-orange text-white",
    purple: "bg-brand-purple text-white",
    red: "bg-red-500 text-white",
    yellow: "bg-yellow-400 text-slate-900",
  }
  
  const borders = {
    blue: "border-brand-blue",
    green: "border-brand-green",
    orange: "border-brand-orange",
    purple: "border-brand-purple",
    red: "border-red-500",
    yellow: "border-yellow-400",
  }

  const { contextSafe } = useGSAP({ scope: containerRef })

  const toggleCard = contextSafe(() => {
    if (!isOpen) {
      // Animate back card coming to the front
      gsap.to(".kpi-front", {
        y: -20,
        scale: 0.9,
        opacity: 0,
        duration: 0.4,
        ease: "power2.inOut",
      })
      gsap.to(".kpi-back", {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.4,
        ease: "power2.inOut",
        delay: 0.1,
      })
      
      // Add subtle rotation to the container for 3d feel
      gsap.to(containerRef.current, {
        rotationY: 10,
        rotationX: -5,
        duration: 0.2,
        yoyo: true,
        repeat: 1
      })
    } else {
      // Revert back to original
      gsap.to(".kpi-back", {
        y: 20,
        scale: 0.9,
        opacity: 0,
        duration: 0.4,
        ease: "power2.inOut",
      })
      gsap.to(".kpi-front", {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: 0.4,
        ease: "power2.inOut",
        delay: 0.1,
      })
      
      gsap.to(containerRef.current, {
        rotationY: -10,
        rotationX: 5,
        duration: 0.2,
        yoyo: true,
        repeat: 1
      })
    }
    setIsOpen(!isOpen)
  })

  // Initial state setup
  useGSAP(() => {
    gsap.set(".kpi-back", { y: 20, scale: 0.9, opacity: 0 })
  }, { scope: containerRef })

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full min-h-[140px] cursor-pointer group perspective-1000",
        className
      )}
      onClick={toggleCard}
    >
      {/* FRONT CARD */}
      <div
        className={cn(
          "kpi-front absolute inset-0 rounded-3xl p-6 shadow-sm border-2 bg-card flex flex-col justify-between transition-shadow hover:shadow-md",
          borders[colorVariant]
        )}
      >
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </h3>
          <p className="text-4xl font-bold tracking-tight text-foreground">
            {isLoading ? <span className="animate-pulse">...</span> : value}
          </p>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-4">{description}</p>
        )}
      </div>

      {/* BACK CARD (Explanation) */}
      <div
        className={cn(
          "kpi-back absolute inset-0 rounded-3xl p-6 shadow-lg flex flex-col justify-center items-center text-center",
          colors[colorVariant]
        )}
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
      >
        <h4 className="text-lg font-bold mb-2">¿Qué significa?</h4>
        <p className="text-sm font-medium leading-relaxed opacity-90">
          {backMessage}
        </p>
        <p className="text-xs opacity-70 mt-4 underline decoration-white/50">Cerrar</p>
      </div>
    </div>
  )
}
