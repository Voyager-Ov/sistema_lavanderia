import React from "react"
import { Button } from "@/shared/ui/forms/button"
import { cn } from "@/shared/lib/utils"
import { LucideIcon, X } from "lucide-react"

export interface BulkAction<TData> {
  label: string
  icon?: LucideIcon
  onClick: (selectedRows: TData[]) => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
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
      <div className="flex items-center gap-4 rounded-full bg-foreground text-background px-6 py-3 shadow-xl ring-1 ring-border/10">
        <div className="flex items-center gap-2 border-r border-background/20 pr-4">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background/20 text-xs font-bold">
            {selectedRows.length}
          </span>
          <span className="text-sm font-medium whitespace-nowrap">
            seleccionados
          </span>
        </div>

        <div className="flex items-center gap-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                variant={action.variant || "secondary"}
                size="sm"
                className={cn(
                  "h-8 rounded-full text-xs font-semibold",
                  !action.variant && "bg-background text-foreground hover:bg-background/90"
                )}
                onClick={() => action.onClick(selectedRows)}
              >
                {Icon && <Icon className="mr-2 h-3.5 w-3.5" />}
                {action.label}
              </Button>
            )
          })}
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-background hover:bg-background/20 hover:text-background ml-2"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Limpiar selección</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
