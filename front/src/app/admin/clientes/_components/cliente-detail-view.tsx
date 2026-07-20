import React from "react"
import { Cliente } from "@/domains/clientes/api"
import { Button } from "@/shared/ui/forms/button"
import { Phone, Mail, User, Wallet, FileText, Activity } from "lucide-react"

interface ClienteDetailViewProps {
  cliente: Cliente
  onEdit: (cliente: Cliente) => void
  onCobrar: (cliente: Cliente) => void
}

export function ClienteDetailView({ cliente, onEdit, onCobrar }: ClienteDetailViewProps) {
  const saldo = parseFloat(cliente.saldoCuentaCorriente?.toString() || "0")
  const tieneDeuda = saldo > 0
  const saldoFavor = saldo < 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header Profile */}
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 pb-6 border-b border-gray-100">
        <div className="w-24 h-24 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-4xl font-black shadow-inner">
          {cliente.nombre.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center sm:text-left flex flex-col justify-center">
          <h2 className="text-3xl font-black text-gray-900">{cliente.nombre}</h2>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-gray-500 font-medium">
            {cliente.telefono && (
              <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                <Phone className="w-4 h-4" /> {cliente.telefono}
              </span>
            )}
            {cliente.email && (
              <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                <Mail className="w-4 h-4" /> {cliente.email}
              </span>
            )}
            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold ${cliente.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <Activity className="w-4 h-4" /> {cliente.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline" className="rounded-full shadow-sm" onClick={() => onEdit(cliente)}>
            Editar Perfil
          </Button>
        </div>
      </div>

      {/* Saldo Section */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Estado de Cuenta</h3>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black ${tieneDeuda ? 'text-red-600' : saldoFavor ? 'text-green-600' : 'text-slate-900'}`}>
              ${Math.abs(saldo).toLocaleString("es-AR")}
            </span>
            <span className={`text-sm font-bold ${tieneDeuda ? 'text-red-500' : saldoFavor ? 'text-green-500' : 'text-slate-400'}`}>
              {tieneDeuda ? 'Deuda a pagar' : saldoFavor ? 'Saldo a favor' : 'Al día'}
            </span>
          </div>
        </div>
        {tieneDeuda && (
          <Button 
            className="rounded-full px-8 h-12 font-bold bg-green-600 hover:bg-green-700 shadow-sm"
            onClick={() => onCobrar(cliente)}
          >
            <Wallet className="w-5 h-5 mr-2" />
            Cobrar Deuda
          </Button>
        )}
      </div>

      {/* Tabs Placeholder (Para futura implementación de Historial) */}
      <div className="mt-4 border-t border-gray-100 pt-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-indigo-500" />
          Resumen de Actividad
        </h3>
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl h-48 flex items-center justify-center text-gray-400 font-medium">
          El historial de pedidos y movimientos se implementará en la próxima versión.
        </div>
      </div>
    </div>
  )
}
