import React from "react"
import { cn } from "@/shared/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  children?: React.ReactNode // Para botones de acción (ej. "Nuevo Cliente")
}

export function PageHeader({ title, description, children, className, ...props }: PageHeaderProps) {
  return (
    <div 
      className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6", className)}
      {...props}
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}
