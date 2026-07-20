import React from "react"
import { Button } from "@/shared/ui/forms/button"
import { Users, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"

interface ClientesHeaderProps {
  // We can add filtering props later if we need a date filter for clients, 
  // but usually clients don't have date filters, they have search filters (which is in the table).
}

export function ClientesHeader({}: ClientesHeaderProps) {
  const router = useRouter()

  return (
    <div className="fade-item flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-1">Clientes</h1>
        <p className="text-gray-500 font-medium text-sm">Gestiona la información y cuentas corrientes de tus clientes.</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <Button onClick={() => router.push('/admin/clientes/nuevo')} className="rounded-full h-12 px-6 shadow-sm hover:shadow-md transition-all font-bold gap-2">
          <span className="text-lg leading-none">+</span> Crear Nuevo Cliente
        </Button>
      </div>
    </div>
  )
}
