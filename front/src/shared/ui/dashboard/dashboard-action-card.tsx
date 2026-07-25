"use client"

import React from "react"
import { cn } from "@/shared/lib/utils"

interface DashboardActionCardProps {
  title: string
  mainText: string
  subText: string
  buttonText: string
  buttonIcon?: React.ReactNode
  onButtonClick?: () => void
  color?: "blue" | "green" | "yellow" | "red"
  className?: string
}

export function DashboardActionCard({
  title,
  mainText,
  subText,
  buttonText,
  buttonIcon,
  onButtonClick,
  color = "blue",
  className
}: DashboardActionCardProps) {
  
  const getColors = () => {
    switch (color) {
      case "green": return { text: "text-brand-green", bg: "bg-brand-green hover:bg-green-700" }
      case "yellow": return { text: "text-brand-yellow", bg: "bg-brand-yellow hover:bg-yellow-600" }
      case "red": return { text: "text-brand-red", bg: "bg-brand-red hover:bg-red-700" }
      default: return { text: "text-brand-blue", bg: "bg-brand-blue hover:bg-blue-700" }
    }
  }
  
  const colors = getColors()

  return (
    <div className={cn("bg-white dark:bg-neutral-800 rounded-[2rem] p-6 lg:p-8 flex flex-col justify-between border border-gray-100 dark:border-neutral-700/50 shadow-sm transition-all hover:shadow-md", className)}>
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-50 mb-4 transition-colors">{title}</h3>
        <p className="text-2xl font-bold leading-tight mb-2 text-gray-900 dark:text-neutral-50 transition-colors">
          {mainText}
        </p>
        <p className="text-sm text-gray-500 dark:text-neutral-400 font-medium transition-colors">
          {subText}
        </p>
      </div>
      
      <button 
        onClick={onButtonClick}
        className={cn("mt-6 w-full py-4 text-white rounded-full font-semibold flex items-center justify-center gap-2 transition-colors active:scale-95", colors.bg)}
      >
        {buttonIcon}
        {buttonText}
      </button>
    </div>
  )
}
