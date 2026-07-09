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
      case "green": return "bg-green-100 text-green-700"
      case "blue": return "bg-blue-100 text-blue-700"
      case "yellow": return "bg-yellow-100 text-yellow-700"
      case "red": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className={cn("bg-white rounded-[2rem] p-6 lg:p-8 flex flex-col border border-gray-100 shadow-sm", className)}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        
        {actionButtonText && (
          <button 
            onClick={onActionClick}
            className="px-4 py-1.5 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1"
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
                <img src={item.avatar} alt={item.title} className="w-10 h-10 rounded-full object-cover bg-gray-100" />
              ) : item.icon ? (
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 border border-gray-100">
                  {item.icon}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-bold border border-brand-green/20">
                  {item.title.charAt(0)}
                </div>
              )}

              {/* Text content */}
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight group-hover:text-brand-green transition-colors">{item.title}</p>
                <p className="text-xs text-gray-500 font-medium mt-1 truncate max-w-[150px] sm:max-w-[200px]">{item.subtitle}</p>
              </div>
            </div>

            {/* Right side status badge or text */}
            <div className="flex items-center">
              {item.badgeText ? (
                <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider", getBadgeColors(item.badgeColor))}>
                  {item.badgeText}
                </span>
              ) : item.rightText ? (
                <span className="text-xs text-gray-400 font-medium">{item.rightText}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
