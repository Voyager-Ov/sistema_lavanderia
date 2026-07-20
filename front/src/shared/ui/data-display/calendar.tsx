"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { es } from "date-fns/locale"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className={cn("p-4 bg-white rounded-t-3xl border border-gray-100 shadow-sm", className)}>
      <DayPicker
        locale={es}
        showOutsideDays={showOutsideDays}
        style={{
          "--rdp-accent-color": "var(--color-brand-blue, #4285F4)",
          "--rdp-accent-background-color": "#eff6ff",
          "--rdp-day_button-border-radius": "100%",
          "--rdp-today-color": "var(--color-brand-blue, #4285F4)",
          "--rdp-day-height": "40px",
          "--rdp-day-width": "40px",
          "--rdp-day_button-height": "40px",
          "--rdp-day_button-width": "40px",
          "--rdp-nav_button-width": "32px",
          "--rdp-nav_button-height": "32px",
        } as React.CSSProperties}
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
