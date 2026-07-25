"use client"

import React from "react"
import { cn } from "@/shared/lib/utils"

export interface DashboardListItem {
  id: string | number
  icon?: React.ReactNode
  avatar?: string
  title: string
  subtitle: string
  badgeText?: string
  badgeColor?: "green" | "blue" | "yellow" | "red" | "default"
  rightText?: string
}

interface DashboardListCardProps {
  title: string
  actionButtonText?: string
  onActionClick?: () => void
  items: DashboardListItem[]
  className?: string
}

export function DashboardListCard({
  title,
  actionButtonText,
  onActionClick,
  items,
  className
}: DashboardListCardProps) {

  const getBadgeColors = (color?: string) => {
    switch(color) {
      case "green": return "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 transition-colors"
      case "blue": return "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 transition-colors"
      case "yellow": return "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 transition-colors"
      case "red": return "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 transition-colors"
      default: return "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 transition-colors"
    }
  }

  return (
    <div className={cn("bg-white dark:bg-neutral-800 rounded-[2rem] p-6 lg:p-8 flex flex-col border border-gray-100 dark:border-neutral-700/50 shadow-sm transition-colors", className)}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-neutral-50 transition-colors">{title}</h3>
        
        {actionButtonText && (
          <button 
            onClick={onActionClick}
            className="px-4 py-1.5 rounded-full border border-gray-200 dark:border-neutral-700 text-xs font-semibold text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1"
          >
            {actionButtonText}
          </button>
        )}
      </div>
      
      <div className="flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
              
              {/* Icon or Avatar */}
              {item.avatar ? (
                <img src={item.avatar} alt={item.title} className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-neutral-800 transition-colors" />
              ) : item.icon ? (
                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-neutral-400 border border-gray-100 dark:border-neutral-700 transition-colors">
                  {item.icon}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-brand-green font-bold border border-brand-green/20 transition-colors">
                  {item.title.charAt(0)}
                </div>
              )}

              {/* Text content */}
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-neutral-50 leading-tight group-hover:text-brand-green transition-colors">{item.title}</p>
                <p className="text-xs text-gray-500 dark:text-neutral-400 font-medium mt-1 truncate max-w-[150px] sm:max-w-[200px] transition-colors">{item.subtitle}</p>
              </div>
            </div>

            {/* Right side status badge or text */}
            <div className="flex items-center">
              {item.badgeText ? (
                <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider", getBadgeColors(item.badgeColor))}>
                  {item.badgeText}
                </span>
              ) : item.rightText ? (
                <span className="text-xs text-gray-400 dark:text-neutral-500 font-medium transition-colors">{item.rightText}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
