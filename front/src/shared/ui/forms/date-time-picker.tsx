"use client"

import * as React from "react"
import { format, setHours, setMinutes, startOfToday } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock, X } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Calendar } from "@/shared/ui/data-display/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/overlays/popover"

export interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00
const MINUTES = ["00", "15", "30", "45"];

export function DateTimePicker({ value, onChange, placeholder = "Seleccionar fecha y hora" }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedHour, setSelectedHour] = React.useState<number | null>(value ? value.getHours() : null)
  const [showTimeDropdown, setShowTimeDropdown] = React.useState(false)
  const timeDropdownRef = React.useRef<HTMLDivElement>(null)

  // Cierra el dropdown de tiempo si se hace clic afuera
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) {
        setShowTimeDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Sync internal hour state when value changes from outside
  React.useEffect(() => {
    if (value) {
      setSelectedHour(value.getHours())
    } else {
      setSelectedHour(null)
    }
  }, [value])

  const handleSelectDate = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      let h = selectedHour
      // Si no hay hora seleccionada, auto-seleccionar la hora actual o 10am
      if (h === null) {
        h = new Date().getHours() + 1
        if (h < 8 || h > 22) h = 10
        setSelectedHour(h)
      }
      
      const newDate = setMinutes(setHours(selectedDate, h), 0)
      onChange?.(newDate)
    } else {
      onChange?.(undefined)
      setSelectedHour(null)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    if (!timeValue) return

    const [hours, minutes] = timeValue.split(':').map(Number)
    let newDate = value ? new Date(value) : new Date()
    newDate = setHours(newDate, hours)
    newDate = setMinutes(newDate, minutes)
    onChange?.(newDate)
    setSelectedHour(hours)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(undefined)
    setSelectedHour(null)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          role="button"
          tabIndex={0}
          className={cn(
            "w-full flex items-center justify-between font-normal bg-gray-50/50 border border-gray-200 hover:bg-white hover:border-brand-blue/30 h-12 rounded-xl px-4 transition-all focus-within:ring-4 focus-within:ring-brand-blue/10 cursor-pointer group",
            !value && "text-gray-500"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100 group-hover:border-brand-blue/30 transition-colors">
              <CalendarIcon className="h-4 w-4 text-brand-blue" />
            </div>
            {value ? (
              <span className="font-bold text-gray-900 tracking-tight text-[15px]">
                {format(value, "d MMM yyyy, HH:mm", { locale: es })} hs
              </span>
            ) : (
              <span className="text-[15px] font-medium">{placeholder}</span>
            )}
          </div>
          
          {value && (
            <button
              onClick={handleClear}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      
      <PopoverContent className="w-auto p-0 rounded-[24px] overflow-hidden shadow-2xl border-gray-100 flex flex-col bg-white" align="start">
        {/* Calendar Section */}
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelectDate}

          className="border-none shadow-none rounded-b-none"
        />
        
        {/* Time Selection Section */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/80 relative">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5" /> Hora de entrega
          </label>
          
          <div className="relative">
            <input
              type="time"
              value={value ? format(value, "HH:mm") : ""}
              onChange={handleTimeChange}
              // Hide native picker indicator and style the input
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[15px] font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue/50 transition-all cursor-text [&::-webkit-calendar-picker-indicator]:hidden"
            />
            {/* Custom Icon Button to open our custom time dropdown */}
            <button
              onClick={() => setShowTimeDropdown(!showTimeDropdown)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-blue hover:bg-blue-50 transition-colors"
            >
              <Clock className="w-4 h-4" />
            </button>
            
            {/* Custom Time Dropdown */}
            {showTimeDropdown && (
              <div 
                ref={timeDropdownRef}
                className="absolute right-0 bottom-full mb-2 w-[240px] bg-white border border-gray-100 rounded-2xl shadow-xl shadow-brand-blue/5 overflow-hidden flex z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                {/* Hours Column */}
                <div className="flex-1 border-r border-gray-50 flex flex-col h-[200px]">
                  <div className="p-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Hora</div>
                  <div className="overflow-y-auto scrollbar-thin flex-1 p-1">
                    {HOURS.map((h) => {
                      const isSelected = selectedHour === h
                      return (
                        <button
                          key={h}
                          onClick={() => {
                            const newDate = value ? new Date(value) : new Date()
                            const dateToSet = setHours(newDate, h)
                            onChange?.(dateToSet)
                            setSelectedHour(h)
                          }}
                          className={cn(
                            "w-full text-center py-2 rounded-lg text-sm font-semibold transition-all mb-0.5",
                            isSelected 
                              ? "bg-brand-blue text-white shadow-sm" 
                              : "text-gray-600 hover:bg-gray-100"
                          )}
                        >
                          {h.toString().padStart(2, '0')}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Minutes Column */}
                <div className="flex-1 flex flex-col h-[200px]">
                  <div className="p-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Min</div>
                  <div className="overflow-y-auto scrollbar-thin flex-1 p-1">
                    {MINUTES.map((m) => {
                      const isSelected = value?.getMinutes() === parseInt(m)
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            const newDate = value ? new Date(value) : new Date()
                            // If hour not set, default to 10
                            const h = selectedHour ?? 10
                            const dateToSet = setMinutes(setHours(newDate, h), parseInt(m))
                            onChange?.(dateToSet)
                            setSelectedHour(h)
                            // Close dropdown after full time selection
                            setShowTimeDropdown(false)
                          }}
                          className={cn(
                            "w-full text-center py-2 rounded-lg text-sm font-semibold transition-all mb-0.5",
                            isSelected 
                              ? "bg-brand-blue text-white shadow-sm" 
                              : "text-gray-600 hover:bg-gray-100"
                          )}
                        >
                          {m}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
