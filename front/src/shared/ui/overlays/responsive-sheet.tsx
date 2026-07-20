"use client"

import * as React from "react"
import { useMediaQuery } from "@/shared/hooks/use-media-query"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/overlays/sheet"

export interface ResponsiveSheetProps extends React.ComponentPropsWithoutRef<typeof Sheet> {
  children: React.ReactNode
}

/**
 * A responsive sheet that automatically acts as a bottom sheet on mobile screens (<640px)
 * and a right-aligned side sheet on desktop screens (>=640px).
 */
export function ResponsiveSheet({ children, ...props }: ResponsiveSheetProps) {
  return (
    <Sheet {...props}>
      {children}
    </Sheet>
  )
}

export interface ResponsiveSheetContentProps extends React.ComponentPropsWithoutRef<typeof SheetContent> {}

export const ResponsiveSheetContent = React.forwardRef<
  React.ElementRef<typeof SheetContent>,
  ResponsiveSheetContentProps
>(({ className, children, ...props }, ref) => {
  const isDesktop = useMediaQuery("(min-width: 640px)")
  // Se asume false por defecto para evitar hidrataciones con el diseño incorrecto inicialmente,
  // pero el hook useMediaQuery ajustará rápidamente en el cliente.
  
  return (
    <SheetContent 
      ref={ref}
      side={isDesktop ? "right" : "bottom"} 
      className={`
        flex flex-col bg-white
        ${isDesktop 
          ? "w-full !max-w-[500px] overflow-y-auto p-6 sm:p-8" 
          : "h-[85vh] w-full rounded-t-[2rem] overflow-y-auto p-6"
        } 
        ${className || ""}
      `}
      {...props}
    >
      {children}
    </SheetContent>
  )
})
ResponsiveSheetContent.displayName = "ResponsiveSheetContent"

export const ResponsiveSheetHeader = SheetHeader
export const ResponsiveSheetTitle = SheetTitle
export const ResponsiveSheetDescription = SheetDescription
