"use client"

import React, { useState, useEffect, useRef } from "react"
import { Search, User, X, Check, Loader2 } from "lucide-react"
import { Cliente, getClientes } from "@/domains/clientes/api"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

interface ClientSearchProps {
  selectedClient: Cliente | null
  onSelectClient: (cliente: Cliente | null) => void
}

export function ClientSearch({ selectedClient, onSelectClient }: ClientSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<Cliente[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLUListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { contextSafe } = useGSAP({ scope: dropdownRef })

  const handleFocus = contextSafe(() => {
    setIsDropdownOpen(true)
    gsap.to(inputRef.current, {
      scale: 1.02,
      boxShadow: "0 10px 25px -5px rgba(66, 133, 244, 0.15), 0 8px 10px -6px rgba(66, 133, 244, 0.1)",
      duration: 0.4,
      ease: "back.out(1.5)"
    })
  })

  const handleBlur = contextSafe(() => {
    gsap.to(inputRef.current, {
      scale: 1,
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      duration: 0.3,
      ease: "power2.out"
    })
  })

  // Initial load: fetch all clients on mount so they appear immediately on focus
  useEffect(() => {
    const loadInitial = async () => {
      setIsSearching(true)
      try {
        const response = await getClientes({})
        setResults(response.data?.items || [])
      } catch (error) {
        console.error("Error loading initial clients", error)
      } finally {
        setIsSearching(false)
      }
    }
    loadInitial()
  }, [])

  // Debounced search on term change
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await getClientes({ search: searchTerm })
        setResults(response.data?.items || [])
        setIsDropdownOpen(true)
      } catch (error) {
        console.error("Error searching clients", error)
      } finally {
        setIsSearching(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Animate results
  useGSAP(() => {
    if (isDropdownOpen && resultsRef.current) {
      gsap.fromTo(
        resultsRef.current.children,
        { opacity: 0, x: -10 },
        { opacity: 1, x: 0, duration: 0.2, stagger: 0.05, ease: "power2.out" }
      )
    }
  }, [isDropdownOpen, results])

  if (selectedClient) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">Cliente Seleccionado</label>
        <div className="flex items-center justify-between bg-blue-50/50 border border-brand-blue/20 py-3 px-5 rounded-full">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{selectedClient.nombre}</p>
              {selectedClient.telefono && <p className="text-sm text-gray-500">{selectedClient.telefono}</p>}
            </div>
          </div>
          <button 
            onClick={() => {
              onSelectClient(null)
              setSearchTerm("")
            }}
            className="text-sm font-medium text-brand-blue hover:text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
          >
            Cambiar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
      <label className="text-sm font-semibold text-gray-700">Buscar Cliente</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-form-type="other"
          className="pl-11 pr-10 h-11 w-full rounded-full bg-gray-100 border-2 border-transparent hover:bg-gray-200/80 focus:bg-white focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/10 shadow-none transition-all text-sm font-medium outline-none text-gray-900 placeholder:text-gray-500"
          placeholder="Nombre, teléfono o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {results.length > 0 ? (
            <ul ref={resultsRef} className="p-2 flex flex-col gap-1">
              {results.map((cliente) => (
                <li key={cliente.id}>
                  <button
                    onClick={() => {
                      onSelectClient(cliente)
                      setIsDropdownOpen(false)
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-brand-blue/10 group-hover:text-brand-blue transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-brand-blue transition-colors">{cliente.nombre}</p>
                      <p className="text-sm text-gray-500">{cliente.telefono || "Sin teléfono"}</p>
                    </div>
                    <Check className="w-5 h-5 text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No se encontraron clientes.</p>
              <p className="text-sm mt-1">Prueba con otra búsqueda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
