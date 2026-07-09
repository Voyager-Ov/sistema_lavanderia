"use client"

import React from "react"
import { ChevronRight } from "lucide-react"

export interface BreadcrumbItemType {
  label: string
  href?: string
  active?: boolean
}

export interface BreadcrumbsProps {
  items: BreadcrumbItemType[]
}

const BREADCRUMB_COLORS = [
  "hover:text-brand-blue",
  "hover:text-brand-green",
  "hover:text-brand-yellow",
  "hover:text-brand-red",
  "hover:text-purple-500",
]

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null

  return (
    <nav className="flex items-center space-x-1 text-sm font-medium">
      {items.map((crumb, index) => {
        const isLast = index === items.length - 1
        const hoverColor = BREADCRUMB_COLORS[index % BREADCRUMB_COLORS.length]
        
        return (
          <div key={crumb.label} className="gsap-header-item flex items-center">
            {crumb.href && !isLast ? (
              <a 
                href={crumb.href} 
                className={`text-gray-900 transition-colors cursor-pointer ${hoverColor}`}
              >
                {crumb.label}
              </a>
            ) : (
              <span className={isLast || crumb.active ? "text-gray-900 font-bold" : "text-gray-900"}>
                {crumb.label}
              </span>
            )}
            
            {!isLast && (
              <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
            )}
          </div>
        )
      })}
    </nav>
  )
}
