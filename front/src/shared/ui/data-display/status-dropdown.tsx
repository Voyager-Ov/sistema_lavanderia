import React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/overlays/dropdown-menu"
import { Button } from "@/shared/ui/forms/button"
import { ChevronDown } from "lucide-react"
import { cn } from "@/shared/lib/utils"

export interface StatusOption {
  value: string
  label: string
  colorClass?: string // Ej: "bg-green-100 text-green-800"
}

interface StatusDropdownProps {
  currentStatus: string
  options: StatusOption[]
  onChange: (newStatus: string) => void
  disabled?: boolean
  className?: string
}

export function StatusDropdown({ currentStatus, options, onChange, disabled, className }: StatusDropdownProps) {
  const currentOption = options.find((opt) => opt.value === currentStatus) || options[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            "h-8 px-3 text-xs font-semibold rounded-full border border-transparent hover:border-border transition-all",
            currentOption?.colorClass || "bg-muted text-muted-foreground",
            className
          )}
        >
          {currentOption?.label || currentStatus}
          <ChevronDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-xl">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className="text-xs font-medium cursor-pointer"
          >
            <div className={cn("w-2 h-2 rounded-full mr-2", option.colorClass?.split(" ")[0])} />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
