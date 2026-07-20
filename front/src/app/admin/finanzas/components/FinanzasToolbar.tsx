import React from "react"
import { Button } from "@/shared/ui/forms/button"
import { Input } from "@/shared/ui/forms/input"
import { Search, MinusCircle, Tags } from "lucide-react"

interface FinanzasToolbarProps {
  search: string;
  setSearch: (val: string) => void;
}

export function FinanzasToolbar({ search, setSearch }: FinanzasToolbarProps) {
  return (
    <div className="flex w-full py-2">
      {/* Search Input - Full Width */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-11 h-12 w-full bg-white rounded-xl border-gray-200 focus-visible:ring-brand-blue shadow-sm font-medium" 
          placeholder="Buscar movimientos (ej: Alquiler, Pedido)..." 
        />
      </div>
    </div>
  )
}
