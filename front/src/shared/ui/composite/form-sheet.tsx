"use client"

import React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/overlays/sheet"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/overlays/drawer"

interface FormSheetProps {
  title: string
  description?: string
  trigger?: React.ReactNode
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function FormSheet({ 
  title, 
  description, 
  trigger, 
  children,
  open,
  onOpenChange
}: FormSheetProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent className="max-h-[96vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
          <div className="flex flex-col gap-4 p-4 overflow-y-auto">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent className="w-full sm:max-w-[500px] overflow-y-auto p-6">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        
        {/* El formulario (children) se encargará de renderizar sus campos */}
        <div className="flex flex-col gap-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
