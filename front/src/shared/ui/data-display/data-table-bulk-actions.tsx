import React from "react"
import { Button } from "@/shared/ui/forms/button"
import { cn } from "@/shared/lib/utils"
import { LucideIcon, X, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/overlays/dropdown-menu"

export interface BulkAction<TData> {
  label: string
  icon?: LucideIcon
  onClick?: (selectedRows: TData[], clearSelection: () => void) => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  colorClass?: string
  type?: "button" | "dropdown"
  options?: {
    label: string
    icon?: LucideIcon
    onClick: (selectedRows: TData[], clearSelection: () => void) => void
    colorClass?: string
  }[]
}

interface DataTableBulkActionsProps<TData> {
  selectedRows: TData[]
  actions: BulkAction<TData>[]
  onClearSelection: () => void
}

export function DataTableBulkActions<TData>({
  selectedRows,
  actions,
  onClearSelection,
}: DataTableBulkActionsProps<TData>) {
  if (selectedRows.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-center gap-4 rounded-full bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-gray-800 px-6 py-3">
        <div className="flex items-center gap-2 border-r border-gray-200/60 pr-4">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue/10 text-xs font-bold text-brand-blue ring-1 ring-brand-blue/20">
            {selectedRows.length}
          </span>
          <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
            seleccionados
          </span>
        </div>

        <div className="flex items-center gap-2">
          {actions.map((action, index) => {
            if (action.type === "dropdown" && action.options) {
              const MainIcon = action.icon
              return (
                <DropdownMenu key={index}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={action.variant || "secondary"}
                      size="sm"
                      className={cn(
                        "h-8 rounded-full text-xs font-bold tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                        action.colorClass || (!action.variant && "bg-white/60 text-brand-blue hover:bg-white border border-white shadow-sm backdrop-blur-md hover:shadow-md")
                      )}
                    >
                      {MainIcon && <MainIcon className="mr-2 h-3.5 w-3.5" />}
                      {action.label}
                      <ChevronDown className="ml-1.5 h-3 w-3 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="rounded-xl p-1.5 shadow-xl border-gray-100 min-w-[180px]">
                    {action.options.map((opt, i) => {
                      const OptIcon = opt.icon
                      return (
                        <DropdownMenuItem
                          key={i}
                          onClick={() => opt.onClick(selectedRows, onClearSelection)}
                          className={cn("rounded-lg cursor-pointer font-bold text-xs py-2 my-0.5", opt.colorClass)}
                        >
                          {OptIcon && <OptIcon className="mr-2 h-4 w-4" />}
                          {opt.label}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            }

            const Icon = action.icon
            return (
              <Button
                key={index}
                variant={action.variant || "secondary"}
                size="sm"
                className={cn(
                  "h-8 rounded-full text-xs font-bold tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                  action.colorClass,
                  !action.colorClass && !action.variant && "bg-white/60 text-brand-blue hover:bg-white border border-white shadow-sm backdrop-blur-md hover:shadow-md",
                  action.variant === "destructive" && "bg-red-50/80 text-red-600 hover:bg-red-100/90 border border-red-100 hover:shadow-md backdrop-blur-md"
                )}
                onClick={() => action.onClick && action.onClick(selectedRows, onClearSelection)}
              >
                {Icon && <Icon className="mr-2 h-3.5 w-3.5" />}
                {action.label}
              </Button>
            )
          })}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 ml-2 transition-colors duration-200"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
            <span className="sr-only">Limpiar selección</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
